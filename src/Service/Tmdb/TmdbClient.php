<?php

namespace App\Service\Tmdb;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final readonly class TmdbClient
{
    // Nombre de requêtes envoyées en parallèle, TMDB tolère une cinquantaine de requêtes par seconde.
    private const int CONCURRENT_REQUESTS = 20;

    private const array MOVIE_LISTS = ['popular', 'top_rated'];

    public function __construct(
        private HttpClientInterface $tmdbClient,
        #[Autowire(env: 'TMDB_API_TOKEN')]
        private string $apiToken,
    ) {
    }

    public function hasApiToken(): bool
    {
        return '' !== $this->apiToken;
    }

    /**
     * Identifiants des films populaires et des mieux notés, sans doublon.
     *
     * @return list<int>
     */
    public function getPopularAndTopRatedMovieIds(int $pages): array
    {
        $tmdbIds = [];
        foreach (self::MOVIE_LISTS as $list) {
            for ($page = 1; $page <= $pages; ++$page) {
                $data = $this->request('movie/'.$list, ['page' => $page])->toArray();
                array_push($tmdbIds, ...array_column($data['results'], 'id'));

                if ($page >= $data['total_pages']) {
                    break;
                }
            }
        }

        return array_values(array_unique($tmdbIds));
    }

    /**
     * Détails des films avec leurs crédits et leurs plateformes, en une requête par film.
     *
     * @param list<int> $tmdbIds
     *
     * @return \Generator<int, array<string, mixed>>
     */
    public function getMovies(array $tmdbIds): \Generator
    {
        return $this->getConcurrently($tmdbIds, 'movie/%d', ['append_to_response' => 'credits,watch/providers']);
    }

    /**
     * @param list<int> $tmdbIds
     *
     * @return \Generator<int, array<string, mixed>> plateformes par pays, indexées par identifiant TMDB du film
     */
    public function getWatchProviders(array $tmdbIds): \Generator
    {
        foreach ($this->getConcurrently($tmdbIds, 'movie/%d/watch/providers') as $tmdbId => $data) {
            yield $tmdbId => $data['results'];
        }
    }

    /**
     * Les requêtes d'un même paquet partent en même temps, les réponses sont lues ensuite.
     *
     * @param list<int>            $tmdbIds
     * @param array<string, mixed> $query
     *
     * @return \Generator<int, array<string, mixed>>
     */
    private function getConcurrently(array $tmdbIds, string $pathPattern, array $query = []): \Generator
    {
        foreach (array_chunk($tmdbIds, self::CONCURRENT_REQUESTS) as $chunk) {
            $responses = [];
            foreach ($chunk as $tmdbId) {
                $responses[$tmdbId] = $this->request(\sprintf($pathPattern, $tmdbId), $query);
            }

            foreach ($responses as $tmdbId => $response) {
                // Un film retiré de TMDB depuis l'import est ignoré plutôt que d'arrêter toute la commande.
                if (404 === $response->getStatusCode()) {
                    continue;
                }

                yield $tmdbId => $response->toArray();
            }
        }
    }

    /**
     * @param array<string, mixed> $query
     */
    private function request(string $path, array $query = []): ResponseInterface
    {
        return $this->tmdbClient->request('GET', $path, [
            'auth_bearer' => $this->apiToken,
            'query' => ['language' => 'fr-FR'] + $query,
        ]);
    }
}
