<?php

namespace App\Tests;

use App\Entity\User;
use App\Service\Tmdb\MovieCatalogFile;
use App\Service\Tmdb\TmdbImporter;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

abstract class ApiTestCase extends WebTestCase
{
    use Factories;
    use ResetDatabase;

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    /**
     * Charge les trois films de tests/Fixtures/movies.jsonl : Inception (2010), The Dark Knight (2008) et Pulp Fiction (1994).
     */
    protected function importMovieCatalog(): void
    {
        $container = static::getContainer();
        $tmdbMovies = $container->get(MovieCatalogFile::class)->read(__DIR__.'/Fixtures/movies.jsonl');
        $container->get(TmdbImporter::class)->importMovies($tmdbMovies);
    }

    /**
     * @param class-string         $class
     * @param array<string, mixed> $criteria
     */
    protected function findId(string $class, array $criteria): int
    {
        return static::getContainer()->get('doctrine')->getRepository($class)->findOneBy($criteria)->getId();
    }

    protected function loginAs(User $user): void
    {
        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($user);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    protected function requestJson(string $method, string $uri, array $payload = []): array
    {
        $this->client->jsonRequest($method, $uri, $payload);

        return json_decode((string) $this->client->getResponse()->getContent(), true) ?? [];
    }
}
