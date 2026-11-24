<?php

namespace App\Tests\Command;

use App\Entity\Company;
use App\Entity\Country;
use App\Entity\Credit;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Entity\MovieWatchProvider;
use App\Entity\Person;
use App\Entity\WatchProvider;
use App\Repository\MovieRepository;
use App\Service\Tmdb\TmdbClient;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

/**
 * Les appels à TMDB sont servis par les réponses enregistrées dans tests/Fixtures/tmdb :
 * GET /3/movie/27205/watch/providers correspond au fichier movie-27205-watch-providers.json.
 */
abstract class TmdbCommandTestCase extends KernelTestCase
{
    use Factories;
    use ResetDatabase;

    // Export des films de tests/Fixtures/tmdb, tel que produit par app:tmdb:export.
    protected const string CATALOG_FILE = __DIR__.'/../Fixtures/movies.jsonl';

    private const string FIXTURES_DIR = __DIR__.'/../Fixtures/tmdb';

    protected MockHttpClient $httpClient;

    protected function setUp(): void
    {
        $this->mockTmdbClient('test-token');
    }

    /**
     * Redémarre le noyau, car le conteneur refuse de remplacer un service déjà remplacé.
     */
    protected function mockTmdbClient(string $apiToken): void
    {
        self::ensureKernelShutdown();
        self::bootKernel();

        $this->httpClient = new MockHttpClient(static function (string $method, string $url): MockResponse {
            $path = trim(substr((string) parse_url($url, \PHP_URL_PATH), \strlen('/3/')), '/');
            $file = \sprintf('%s/%s.json', self::FIXTURES_DIR, str_replace('/', '-', $path));

            if (!is_file($file)) {
                return new MockResponse('{"success":false}', ['http_code' => 404]);
            }

            return new MockResponse((string) file_get_contents($file));
        }, 'https://api.themoviedb.org/3/');

        self::getContainer()->set(TmdbClient::class, new TmdbClient($this->httpClient, $apiToken));
    }

    protected function findMovie(int $tmdbId): ?Movie
    {
        self::getContainer()->get('doctrine')->getManager()->clear();

        return self::getContainer()->get(MovieRepository::class)->findOneBy(['tmdbId' => $tmdbId]);
    }

    /**
     * @return array<class-string, int> nombre de lignes par entité du catalogue
     */
    protected function countCatalogRows(): array
    {
        $entityManager = self::getContainer()->get('doctrine')->getManager();
        $counts = [];
        foreach ([Movie::class, Genre::class, Company::class, Country::class, Person::class, Credit::class, WatchProvider::class, MovieWatchProvider::class] as $class) {
            $counts[$class] = $entityManager->getRepository($class)->count();
        }

        return $counts;
    }

    /**
     * @return list<string> les disponibilités au format "FR flatrate Netflix", triées
     */
    protected function describeWatchProviders(Movie $movie): array
    {
        $descriptions = [];
        foreach ($movie->getWatchProviders() as $movieWatchProvider) {
            $descriptions[] = \sprintf('%s %s %s', $movieWatchProvider->getRegion(), $movieWatchProvider->getType()->value, $movieWatchProvider->getWatchProvider()->getName());
        }
        sort($descriptions);

        return $descriptions;
    }
}
