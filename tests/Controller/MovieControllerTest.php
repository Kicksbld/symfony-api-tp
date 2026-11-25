<?php

namespace App\Tests\Controller;

use App\Entity\Company;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Entity\Person;
use App\Entity\WatchProvider;
use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class MovieControllerTest extends ApiTestCase
{
    private const int INCEPTION = 27205;

    private const int PULP_FICTION = 680;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
    }

    public function testListReturnsALightViewOfThePopularMoviesFirst(): void
    {
        $data = $this->requestJson('GET', '/api/movies');

        self::assertResponseIsSuccessful();
        self::assertSame(3, $data['total']);
        self::assertSame(1, $data['lastPage']);
        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir', 'Pulp Fiction'], array_column($data['items'], 'title'));
        self::assertSame([
            'id' => $this->findId(Movie::class, ['tmdbId' => self::INCEPTION]),
            'title' => 'Inception',
            'originalTitle' => 'Inception',
            'releaseDate' => '2010-07-15',
            'posterUrl' => 'https://image.tmdb.org/t/p/w500/aej3LRUga5rhgkmRP6XMFw3ejbl.jpg',
        ], $data['items'][0]);
    }

    public function testListIsPaginated(): void
    {
        $data = $this->requestJson('GET', '/api/movies?page=2&limit=2');

        self::assertResponseIsSuccessful();
        self::assertSame(['Pulp Fiction'], array_column($data['items'], 'title'));
        self::assertSame(3, $data['total']);
        self::assertSame(2, $data['lastPage']);
    }

    public function testListRejectsAnInvalidPagination(): void
    {
        $data = $this->requestJson('GET', '/api/movies?page=0&limit=101');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['page', 'limit'], array_column($data['violations'], 'propertyPath'));
    }

    /**
     * @param list<string> $expectedTitles
     */
    #[DataProvider('provideSearches')]
    public function testListCanBeSearchedAndFiltered(string $queryString, array $expectedTitles): void
    {
        $data = $this->requestJson('GET', '/api/movies?'.$queryString);

        self::assertResponseIsSuccessful();
        self::assertSame($expectedTitles, array_column($data['items'], 'title'));
    }

    public static function provideSearches(): iterable
    {
        yield 'title' => ['q=pulp', ['Pulp Fiction']];
        yield 'original title' => ['q=the dark knight', ['The Dark Knight : Le Chevalier noir']];
        yield 'decade' => ['decade=2000', ['The Dark Knight : Le Chevalier noir']];
        yield 'year' => ['year=1994', ['Pulp Fiction']];
        yield 'production country' => ['country=GB', ['Inception', 'The Dark Knight : Le Chevalier noir']];
        yield 'filters combined' => ['country=US&decade=1990', ['Pulp Fiction']];
        yield 'no result' => ['q=titanic', []];
    }

    public function testListCanBeFilteredByGenre(): void
    {
        $genreId = $this->findId(Genre::class, ['name' => 'Comédie']);

        $data = $this->requestJson('GET', '/api/movies?genre='.$genreId);

        self::assertSame(['Pulp Fiction'], array_column($data['items'], 'title'));
    }

    public function testListCanBeFilteredByCompany(): void
    {
        $companyId = $this->findId(Company::class, ['name' => 'Syncopy']);

        $data = $this->requestJson('GET', '/api/movies?company='.$companyId);

        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir'], array_column($data['items'], 'title'));
    }

    public function testListCanBeFilteredByWatchProviderInFranceByDefault(): void
    {
        $netflixId = $this->findId(WatchProvider::class, ['name' => 'Netflix']);

        $data = $this->requestJson('GET', '/api/movies?provider='.$netflixId);

        self::assertSame(['Inception'], array_column($data['items'], 'title'));
        self::assertSame(1, $data['total']);
    }

    public function testListCanBeFilteredByWatchProviderInAnotherRegion(): void
    {
        $netflixId = $this->findId(WatchProvider::class, ['name' => 'Netflix']);

        $data = $this->requestJson('GET', '/api/movies?provider='.$netflixId.'&region=BE');

        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir'], array_column($data['items'], 'title'));
    }

    public function testMoviesAvailableSeveralTimesOnAProviderAreListedOnce(): void
    {
        $appleTvStoreId = $this->findId(WatchProvider::class, ['name' => 'Apple TV Store']);

        $data = $this->requestJson('GET', '/api/movies?provider='.$appleTvStoreId.'&limit=2');

        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir'], array_column($data['items'], 'title'));
        self::assertSame(3, $data['total']);
    }

    #[DataProvider('provideSorts')]
    public function testListCanBeSorted(string $sort, array $expectedTitles): void
    {
        $data = $this->requestJson('GET', '/api/movies?sort='.$sort);

        self::assertResponseIsSuccessful();
        self::assertSame($expectedTitles, array_column($data['items'], 'title'));
    }

    public static function provideSorts(): iterable
    {
        yield 'popular' => ['popular', ['Inception', 'The Dark Knight : Le Chevalier noir', 'Pulp Fiction']];
        yield 'most recent release first' => ['releaseDate', ['Inception', 'The Dark Knight : Le Chevalier noir', 'Pulp Fiction']];
        yield 'title' => ['title', ['Inception', 'Pulp Fiction', 'The Dark Knight : Le Chevalier noir']];
    }

    public function testListRejectsInvalidFilters(): void
    {
        $data = $this->requestJson('GET', '/api/movies?decade=1995&year=100000&country=XX&region=ZZ');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['decade', 'year', 'country', 'region'], array_column($data['violations'], 'propertyPath'));
    }

    public function testListRejectsAnUnknownSort(): void
    {
        $this->requestJson('GET', '/api/movies?sort=random');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function testShowReturnsTheFullMovieSheet(): void
    {
        $data = $this->requestJson('GET', '/api/movies/'.$this->findId(Movie::class, ['tmdbId' => self::INCEPTION]));

        self::assertResponseIsSuccessful();
        self::assertSame('Inception', $data['title']);
        self::assertSame('2010-07-15', $data['releaseDate']);
        self::assertSame(148, $data['runtime']);
        self::assertStringStartsWith('Dom Cobb est un voleur expérimenté', $data['overview']);
        self::assertSame('https://image.tmdb.org/t/p/w500/aej3LRUga5rhgkmRP6XMFw3ejbl.jpg', $data['posterUrl']);
        self::assertSame(8.373, $data['voteAverage']);
        self::assertSame(40812, $data['voteCount']);
        self::assertSame(['Action', 'Science-Fiction', 'Crime'], array_column($data['genres'], 'name'));
        self::assertSame(['Warner Bros. Pictures', 'Legendary Pictures', 'Syncopy'], array_column($data['companies'], 'name'));
        self::assertSame('https://image.tmdb.org/t/p/w92/3tvBqYsBhxWeHlu62SIJ1el93O7.png', $data['companies'][2]['logoUrl']);
        self::assertSame([['code' => 'GB', 'name' => 'United Kingdom'], ['code' => 'US', 'name' => 'United States of America']], $data['countries']);
    }

    public function testShowListsTheCastWithTheirCharacterAndTheCrewWithTheirJob(): void
    {
        $data = $this->requestJson('GET', '/api/movies/'.$this->findId(Movie::class, ['tmdbId' => self::INCEPTION]));

        self::assertCount(15, $data['cast']);
        self::assertSame([
            'person' => [
                'id' => $this->findId(Person::class, ['tmdbId' => 6193]),
                'name' => 'Leonardo DiCaprio',
                'profileUrl' => 'https://image.tmdb.org/t/p/w185/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg',
            ],
            'character' => 'Dom Cobb',
        ], $data['cast'][0]);

        $crew = array_map(static fn (array $credit): string => $credit['job'].' '.$credit['person']['name'], $data['crew']);
        self::assertSame([
            'Director Christopher Nolan',
            'Writer Christopher Nolan',
            'Director of Photography Wally Pfister',
            'Original Music Composer Hans Zimmer',
            'Editor Lee Smith',
        ], $crew);
        self::assertSame('Directing', $data['crew'][0]['department']);
        self::assertArrayNotHasKey('character', $data['crew'][0]);
    }

    public function testShowReturnsNotFoundForAnUnknownMovie(): void
    {
        $data = $this->requestJson('GET', '/api/movies/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertSame(Response::HTTP_NOT_FOUND, $data['status']);
    }

    public function testWatchProvidersAreGroupedByTypeForFranceByDefault(): void
    {
        $data = $this->requestJson('GET', '/api/movies/'.$this->findId(Movie::class, ['tmdbId' => self::PULP_FICTION]).'/watch-providers');

        self::assertResponseIsSuccessful();
        self::assertSame(['flatrate', 'rent', 'buy'], array_keys($data));
        self::assertSame([], $data['flatrate']);
        self::assertSame(['Apple TV Store'], array_column($data['rent'], 'name'));
        self::assertSame(['Apple TV Store', 'Canal VOD'], array_column($data['buy'], 'name'));
        self::assertSame(['id', 'name', 'logoUrl'], array_keys($data['buy'][0]));
    }

    public function testWatchProvidersCanBeAskedForAnotherRegion(): void
    {
        $data = $this->requestJson('GET', '/api/movies/'.$this->findId(Movie::class, ['tmdbId' => self::PULP_FICTION]).'/watch-providers?region=BE');

        self::assertSame(['Amazon Prime Video'], array_column($data['flatrate'], 'name'));
        self::assertSame([], $data['rent']);
    }

    public function testWatchProvidersRejectAnUnsupportedRegion(): void
    {
        $data = $this->requestJson('GET', '/api/movies/'.$this->findId(Movie::class, ['tmdbId' => self::PULP_FICTION]).'/watch-providers?region=JP');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['region'], array_column($data['violations'], 'propertyPath'));
    }

    public function testWatchProvidersOfAnUnknownMovieReturnNotFound(): void
    {
        $this->requestJson('GET', '/api/movies/999999/watch-providers');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testListRejectsAPageThatIsNotANumber(): void
    {
        $this->requestJson('GET', '/api/movies?page=abc');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
