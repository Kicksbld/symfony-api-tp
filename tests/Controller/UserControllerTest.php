<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class UserControllerTest extends ApiTestCase
{
    public function testAnyoneCanSeeThePublicProfileOfAMember(): void
    {
        $user = UserFactory::createOne(['email' => 'cobb@example.com', 'username' => 'cobb', 'bio' => 'Architecte de rêves.']);

        $data = $this->requestJson('GET', '/api/users/cobb');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'id' => $user->getId(),
            'username' => 'cobb',
            'bio' => 'Architecte de rêves.',
            'favorites' => [],
            'watchedCount' => 0,
        ], $data);
    }

    public function testShowAnUnknownMemberReturnsNotFound(): void
    {
        $data = $this->requestJson('GET', '/api/users/nobody');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertSame(Response::HTTP_NOT_FOUND, $data['status']);
    }

    #[DataProvider('provideProfilePages')]
    public function testProfilePageOfAnUnknownMemberReturnsNotFound(string $page): void
    {
        $this->requestJson('GET', '/api/users/nobody/'.$page);

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public static function provideProfilePages(): iterable
    {
        foreach (['diary', 'watched', 'likes', 'watchlist', 'lists'] as $page) {
            yield $page => [$page];
        }
    }

    public function testProfileShowsTheFavoritesInOrderAndTheNumberOfMoviesWatched(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $pulpFictionId = $this->findId(Movie::class, ['originalTitle' => 'Pulp Fiction']);
        $darkKnightId = $this->findId(Movie::class, ['originalTitle' => 'The Dark Knight']);
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $this->requestJson('PUT', '/api/me/favorites', ['movies' => [$pulpFictionId, $inceptionId]]);
        $this->requestJson('POST', '/api/log-entries', ['movie' => $inceptionId]);
        $this->requestJson('POST', '/api/log-entries', ['movie' => $inceptionId]);
        $this->requestJson('PATCH', '/api/movies/'.$darkKnightId.'/relationship', ['watched' => true]);
        $this->requestJson('PATCH', '/api/movies/'.$pulpFictionId.'/relationship', ['inWatchlist' => true]);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', '/api/users/cobb');

        self::assertSame([$pulpFictionId, $inceptionId], array_column($data['favorites'], 'id'));
        self::assertSame(['id', 'title', 'originalTitle', 'releaseDate', 'averageRating', 'posterUrl'], array_keys($data['favorites'][0]));
        self::assertSame(2, $data['watchedCount']);
    }

    public function testAnyoneCanSearchMembersByUsername(): void
    {
        UserFactory::createOne(['username' => 'film_buff']);
        $arthur = UserFactory::createOne(['username' => 'arthur_films']);
        UserFactory::createOne(['username' => 'cobb']);

        $data = $this->requestJson('GET', '/api/users?q=FILM&limit=1');

        self::assertResponseIsSuccessful();
        self::assertSame(2, $data['total']);
        self::assertSame(2, $data['lastPage']);
        self::assertSame([['id' => $arthur->getId(), 'username' => 'arthur_films']], $data['items']);
    }

    public function testSearchMatchesAnUnderscoreLiterally(): void
    {
        UserFactory::createOne(['username' => 'jane_doe']);
        UserFactory::createOne(['username' => 'janexdoe']);

        $data = $this->requestJson('GET', '/api/users?q=e_d');

        self::assertSame(['jane_doe'], array_column($data['items'], 'username'));
    }

    public function testSearchRejectsATooLongQuery(): void
    {
        $data = $this->requestJson('GET', '/api/users?q='.str_repeat('a', 21));

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['q'], array_column($data['violations'], 'propertyPath'));
    }

    public function testDiaryListsDatedEntriesFromTheMostRecentViewing(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $march = $this->logMovie($inceptionId, ['watchedOn' => '2026-03-14', 'review' => 'Encore mieux.']);
        $january = $this->logMovie($inceptionId, ['watchedOn' => '2026-01-10']);
        $this->logMovie($inceptionId);
        $this->loginAs(UserFactory::createOne());
        $this->logMovie($inceptionId, ['watchedOn' => '2026-02-01']);

        $data = $this->requestJson('GET', '/api/users/cobb/diary');

        self::assertResponseIsSuccessful();
        self::assertSame(2, $data['total']);
        self::assertSame([$march, $january], array_column($data['items'], 'id'));
        self::assertSame('Encore mieux.', $data['items'][0]['review']);
    }

    public function testDiaryCanBeFilteredByYearAndMonth(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $this->logMovie($inceptionId, ['watchedOn' => '2025-12-31']);
        $endOfJanuary = $this->logMovie($inceptionId, ['watchedOn' => '2026-01-31']);
        $startOfJanuary = $this->logMovie($inceptionId, ['watchedOn' => '2026-01-01']);
        $february = $this->logMovie($inceptionId, ['watchedOn' => '2026-02-01']);

        $byYear = $this->requestJson('GET', '/api/users/cobb/diary?year=2026');
        self::assertSame([$february, $endOfJanuary, $startOfJanuary], array_column($byYear['items'], 'id'));

        $byMonth = $this->requestJson('GET', '/api/users/cobb/diary?year=2026&month=1');
        self::assertSame([$endOfJanuary, $startOfJanuary], array_column($byMonth['items'], 'id'));
    }

    #[DataProvider('provideInvalidDiaryFilters')]
    public function testDiaryRejectsInvalidFilters(string $query, string $expectedPropertyPath): void
    {
        UserFactory::createOne(['username' => 'cobb']);

        $data = $this->requestJson('GET', '/api/users/cobb/diary?'.$query);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$expectedPropertyPath], array_column($data['violations'], 'propertyPath'));
    }

    public static function provideInvalidDiaryFilters(): iterable
    {
        yield 'month without year' => ['month=1', 'month'];
        yield 'month out of range' => ['year=2026&month=13', 'month'];
        yield 'year out of range' => ['year=99999', 'year'];
    }

    public function testProfileListsTheWatchedLikedAndWatchlistedMoviesFromTheMostRecent(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $darkKnightId = $this->findId(Movie::class, ['originalTitle' => 'The Dark Knight']);
        $pulpFictionId = $this->findId(Movie::class, ['originalTitle' => 'Pulp Fiction']);
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $this->logMovie($inceptionId, ['rating' => 4.5, 'liked' => true]);
        $this->requestJson('PATCH', '/api/movies/'.$darkKnightId.'/relationship', ['watched' => true]);
        $this->requestJson('PATCH', '/api/movies/'.$pulpFictionId.'/relationship', ['inWatchlist' => true]);
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$inceptionId.'/relationship', ['inWatchlist' => true, 'liked' => true]);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $watched = $this->requestJson('GET', '/api/users/cobb/watched');
        self::assertResponseIsSuccessful();
        self::assertSame([$darkKnightId, $inceptionId], array_column(array_column($watched['items'], 'movie'), 'id'));
        self::assertSame(4.5, $watched['items'][1]['rating']);
        self::assertTrue($watched['items'][1]['liked']);

        $liked = $this->requestJson('GET', '/api/users/cobb/likes');
        self::assertSame([$inceptionId], array_column(array_column($liked['items'], 'movie'), 'id'));

        $watchlist = $this->requestJson('GET', '/api/users/cobb/watchlist?limit=1');
        self::assertSame(1, $watchlist['total']);
        self::assertSame([$pulpFictionId], array_column(array_column($watchlist['items'], 'movie'), 'id'));
    }

    public function testOthersOnlySeeThePublicListsOfAMember(): void
    {
        $author = UserFactory::createOne(['username' => 'cobb']);
        $this->loginAs($author);
        $publicListId = $this->requestJson('POST', '/api/lists', ['name' => 'Nolan'])['id'];
        $privateListId = $this->requestJson('POST', '/api/lists', ['name' => 'Secret', 'public' => false])['id'];
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', '/api/lists', ['name' => 'Autre membre']);

        $asAnotherMember = $this->requestJson('GET', '/api/users/cobb/lists');
        self::assertResponseIsSuccessful();
        self::assertSame([$publicListId], array_column($asAnotherMember['items'], 'id'));

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $asVisitor = $this->requestJson('GET', '/api/users/cobb/lists');
        self::assertSame([$publicListId], array_column($asVisitor['items'], 'id'));

        $this->loginAs($author);
        $asAuthor = $this->requestJson('GET', '/api/users/cobb/lists');
        self::assertSame([$privateListId, $publicListId], array_column($asAuthor['items'], 'id'));
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function logMovie(int $movieId, array $payload = []): int
    {
        return $this->requestJson('POST', '/api/log-entries', ['movie' => $movieId] + $payload)['id'];
    }
}
