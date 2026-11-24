<?php

namespace App\Tests\Command;

use App\Entity\Credit;
use App\Entity\Movie;

final class TmdbImportCommandTest extends TmdbCommandTestCase
{
    public function testImportsPopularAndTopRatedMoviesWithTheirDetails(): void
    {
        $result = self::runCommand('app:tmdb:import', ['--pages' => 1]);

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('3 movies imported', $result->getDisplay());

        $inception = $this->findMovie(27205);
        self::assertNotNull($inception);
        self::assertSame('Inception', $inception->getTitle());
        self::assertSame('Inception', $inception->getOriginalTitle());
        self::assertStringStartsWith('Dom Cobb est un voleur', $inception->getOverview());
        self::assertSame('2010-07-15', $inception->getReleaseDate()->format('Y-m-d'));
        self::assertSame(148, $inception->getRuntime());
        self::assertSame('/aej3LRUga5rhgkmRP6XMFw3ejbl.jpg', $inception->getPosterPath());
        self::assertSame(53.9354, $inception->getPopularity());
        self::assertSame(8.373, $inception->getVoteAverage());
        self::assertSame(40812, $inception->getVoteCount());
        self::assertSame(['Action', 'Science-Fiction', 'Crime'], $inception->getGenres()->map(static fn ($genre) => $genre->getName())->getValues());
        self::assertSame(['Warner Bros. Pictures', 'Legendary Pictures', 'Syncopy'], $inception->getCompanies()->map(static fn ($company) => $company->getName())->getValues());
        self::assertSame(['GB', 'US'], $inception->getCountries()->map(static fn ($country) => $country->getCode())->getValues());

        self::assertNotNull($this->findMovie(155));
        self::assertNotNull($this->findMovie(680));
    }

    public function testImportsTheMainCastAndTheKeyCrewJobs(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);

        $pulpFiction = $this->findMovie(680);
        $cast = $pulpFiction->getCast();
        $crew = $pulpFiction->getCrew();

        self::assertCount(15, $cast);
        self::assertSame(['John Travolta', 'Vincent Vega', 0], [$cast[0]->getPerson()->getName(), $cast[0]->getCharacter(), $cast[0]->getPosition()]);
        self::assertSame('Duane Whitaker', $cast[14]->getPerson()->getName());

        self::assertSame([
            'Director Quentin Tarantino (Directing)',
            'Writer Quentin Tarantino (Writing)',
            'Director of Photography Andrzej Sekuła (Camera)',
            'Editor Sally Menke (Editing)',
        ], array_map(static fn (Credit $credit): string => \sprintf('%s %s (%s)', $credit->getJob(), $credit->getPerson()->getName(), $credit->getDepartment()), $crew));

        // Tarantino joue, réalise et écrit le film : une seule personne pour trois crédits.
        self::assertSame($cast[10]->getPerson(), $crew[0]->getPerson());
        self::assertSame($crew[0]->getPerson(), $crew[1]->getPerson());
    }

    public function testImportsWatchProvidersOfTheSupportedRegionsOnly(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);

        self::assertSame([
            'BE flatrate Amazon Prime Video',
            'FR buy Apple TV Store',
            'FR buy Canal VOD',
            'FR rent Apple TV Store',
            'US flatrate Apple TV',
        ], $this->describeWatchProviders($this->findMovie(680)));
    }

    public function testRunningTheImportTwiceCreatesNoDuplicates(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);
        $countsAfterFirstImport = $this->countCatalogRows();

        $result = self::runCommand('app:tmdb:import', ['--pages' => 1]);

        $this->assertCommandIsSuccessful($result);
        self::assertSame($countsAfterFirstImport, $this->countCatalogRows());
        self::assertSame(3, $countsAfterFirstImport[Movie::class]);
        self::assertCount(19, $this->findMovie(680)->getCredits());
    }

    public function testImportsTheExportedFileWithoutCallingTmdb(): void
    {
        $this->mockTmdbClient('');

        $result = self::runCommand('app:tmdb:import', ['--from-file' => self::CATALOG_FILE]);

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('3 movies imported', $result->getDisplay());
        self::assertSame(0, $this->httpClient->getRequestsCount());

        $pulpFiction = $this->findMovie(680);
        self::assertSame('Pulp Fiction', $pulpFiction->getTitle());
        self::assertSame('1994-09-10', $pulpFiction->getReleaseDate()->format('Y-m-d'));
        self::assertCount(19, $pulpFiction->getCredits());
        self::assertSame([
            'BE flatrate Amazon Prime Video',
            'FR buy Apple TV Store',
            'FR buy Canal VOD',
            'FR rent Apple TV Store',
            'US flatrate Apple TV',
        ], $this->describeWatchProviders($pulpFiction));
    }

    public function testFailsWithoutTmdbToken(): void
    {
        $this->mockTmdbClient('');

        $result = self::runCommand('app:tmdb:import', ['--pages' => 1]);

        $this->assertCommandFailed($result);
        self::assertStringContainsString('TMDB_API_TOKEN', $result->getDisplay());
    }
}
