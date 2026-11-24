<?php

namespace App\Tests\Command;

final class TmdbRefreshProvidersCommandTest extends TmdbCommandTestCase
{
    public function testReplacesTheWatchProvidersOfExistingMovies(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);

        $result = self::runCommand('app:tmdb:refresh-providers');

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('3 movies updated', $result->getDisplay());
        self::assertSame(['CH flatrate Netflix', 'FR flatrate Netflix', 'FR rent Apple TV Store'], $this->describeWatchProviders($this->findMovie(27205)));
        self::assertSame([], $this->describeWatchProviders($this->findMovie(155)));
        self::assertSame(['US flatrate Apple TV', 'US rent Plex'], $this->describeWatchProviders($this->findMovie(680)));
    }

    public function testLeavesTheRestOfTheCatalogUntouched(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);
        $pulpFiction = $this->findMovie(680);
        $title = $pulpFiction->getTitle();
        $creditCount = $pulpFiction->getCredits()->count();
        $requestCount = $this->httpClient->getRequestsCount();

        self::runCommand('app:tmdb:refresh-providers');

        $pulpFiction = $this->findMovie(680);
        self::assertSame($title, $pulpFiction->getTitle());
        self::assertCount($creditCount, $pulpFiction->getCredits());
        // Une seule requête par film, vers les plateformes : les détails ne sont pas rechargés.
        self::assertSame($requestCount + 3, $this->httpClient->getRequestsCount());
    }

    public function testFailsWithoutTmdbToken(): void
    {
        $this->mockTmdbClient('');

        $result = self::runCommand('app:tmdb:refresh-providers');

        $this->assertCommandFailed($result);
        self::assertStringContainsString('TMDB_API_TOKEN', $result->getDisplay());
    }
}
