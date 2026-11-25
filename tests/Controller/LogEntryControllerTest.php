<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Entity\User;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class LogEntryControllerTest extends ApiTestCase
{
    private const int INCEPTION = 27205;

    private const int THE_DARK_KNIGHT = 155;

    private int $movieId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
        $this->movieId = $this->findId(Movie::class, ['tmdbId' => self::INCEPTION]);
    }

    public function testMemberCanLogAMovie(): void
    {
        $user = UserFactory::createOne(['username' => 'cobb']);
        $this->loginAs($user);

        $data = $this->requestJson('POST', '/api/log-entries', [
            'movie' => $this->movieId,
            'watchedOn' => '2026-11-20',
            'rating' => 4.5,
            'liked' => true,
            'rewatch' => true,
            'review' => 'Un rêve dans un rêve.',
            'containsSpoilers' => true,
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertIsInt($data['id']);
        self::assertSame(['id' => $user->getId(), 'username' => 'cobb'], $data['user']);
        self::assertSame($this->movieId, $data['movie']['id']);
        self::assertSame('Inception', $data['movie']['title']);
        self::assertSame('2026-11-20', $data['watchedOn']);
        self::assertSame(4.5, $data['rating']);
        self::assertTrue($data['liked']);
        self::assertTrue($data['rewatch']);
        self::assertSame('Un rêve dans un rêve.', $data['review']);
        self::assertTrue($data['containsSpoilers']);
        self::assertArrayHasKey('createdAt', $data);
    }

    public function testLoggingAMovieUpdatesTheMemberRelationship(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['inWatchlist' => true]);

        $this->requestJson('POST', '/api/log-entries', ['movie' => $this->movieId, 'rating' => 4, 'liked' => true]);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $relationship = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame(['watched' => true, 'liked' => true, 'rating' => 4, 'inWatchlist' => false], $relationship);

        $ratings = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/ratings');
        self::assertSame(1, $ratings['count']);
        self::assertSame(4, $ratings['average']);
    }

    public function testEntryWithoutRatingOrLikeKeepsThoseOfTheRelationship(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['liked' => true, 'rating' => 3]);

        $data = $this->requestJson('POST', '/api/log-entries', ['movie' => $this->movieId]);
        self::assertNull($data['watchedOn']);
        self::assertNull($data['rating']);
        self::assertFalse($data['liked']);
        self::assertNull($data['review']);

        $relationship = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame(['watched' => true, 'liked' => true, 'rating' => 3, 'inWatchlist' => false], $relationship);
    }

    /**
     * @param array<string, mixed> $payload
     */
    #[DataProvider('provideInvalidCreatePayloads')]
    public function testCreateRejectsInvalidData(array $payload, string $expectedPropertyPath): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('POST', '/api/log-entries', $payload + ['movie' => $this->movieId]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$expectedPropertyPath], array_column($data['violations'], 'propertyPath'));
    }

    public function testAcceptsTomorrowInUtcForMembersAheadOfTheServer(): void
    {
        $this->logMovie(['watchedOn' => new \DateTimeImmutable('tomorrow')->format('Y-m-d')]);
    }

    public static function provideInvalidCreatePayloads(): iterable
    {
        yield 'missing movie' => [['movie' => null], 'movie'];
        yield 'unknown movie' => [['movie' => 999999], 'movie'];
        yield 'watched in the future' => [['watchedOn' => new \DateTimeImmutable('+2 days')->format('Y-m-d')], 'watchedOn'];
        yield 'not a date' => [['watchedOn' => 'yesterday-ish'], 'watchedOn'];
        yield 'rating not a half star' => [['rating' => 3.7], 'rating'];
        yield 'rating too high' => [['rating' => 6], 'rating'];
        yield 'blank review' => [['review' => '  '], 'review'];
        yield 'not a boolean' => [['rewatch' => 'yes'], 'rewatch'];
    }

    public function testCreateRequiresAuthentication(): void
    {
        $this->requestJson('POST', '/api/log-entries', ['movie' => $this->movieId]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAnyoneCanReadAnEntry(): void
    {
        $logEntryId = $this->logMovie(['review' => 'Vertigineux.']);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', '/api/log-entries/'.$logEntryId);

        self::assertResponseIsSuccessful();
        self::assertSame($logEntryId, $data['id']);
        self::assertSame('Vertigineux.', $data['review']);
    }

    public function testShowAnUnknownEntryReturnsNotFound(): void
    {
        $this->requestJson('GET', '/api/log-entries/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAuthorCanUpdateTheirEntry(): void
    {
        $logEntryId = $this->logMovie(['rating' => 2, 'review' => 'Trop long.', 'watchedOn' => '2026-01-10']);

        $data = $this->requestJson('PATCH', '/api/log-entries/'.$logEntryId, [
            'rating' => 4.5,
            'review' => 'Meilleur au deuxième visionnage.',
            'containsSpoilers' => true,
        ]);

        self::assertResponseIsSuccessful();
        self::assertSame(4.5, $data['rating']);
        self::assertSame('Meilleur au deuxième visionnage.', $data['review']);
        self::assertTrue($data['containsSpoilers']);
        self::assertSame('2026-01-10', $data['watchedOn']);
        self::assertFalse($data['liked']);
    }

    public function testUpdateWithNullRemovesTheRatingTheDateAndTheReview(): void
    {
        $logEntryId = $this->logMovie(['rating' => 2, 'review' => 'Trop long.', 'watchedOn' => '2026-01-10']);

        $data = $this->requestJson('PATCH', '/api/log-entries/'.$logEntryId, ['rating' => null, 'review' => null, 'watchedOn' => null]);

        self::assertResponseIsSuccessful();
        self::assertNull($data['rating']);
        self::assertNull($data['review']);
        self::assertNull($data['watchedOn']);
    }

    public function testUpdatingTheLatestEntryUpdatesTheRatingAndLikeOfTheMember(): void
    {
        $user = UserFactory::createOne();
        $this->logMovie(['rating' => 2], $user);
        $latest = $this->logMovie(['rating' => 3], $user);

        $this->requestJson('PATCH', '/api/log-entries/'.$latest, ['rating' => 4.5, 'liked' => true]);
        self::assertResponseIsSuccessful();

        $relationship = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame(4.5, $relationship['rating']);
        self::assertTrue($relationship['liked']);
        self::assertSame(4.5, $this->requestJson('GET', '/api/movies/'.$this->movieId.'/ratings')['average']);
    }

    public function testUpdatingAnOlderEntryKeepsTheRatingOfTheLatest(): void
    {
        $user = UserFactory::createOne();
        $older = $this->logMovie(['rating' => 2], $user);
        $this->logMovie(['rating' => 3], $user);

        $this->requestJson('PATCH', '/api/log-entries/'.$older, ['rating' => 5, 'liked' => true]);
        self::assertResponseIsSuccessful();

        $relationship = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame(3, $relationship['rating']);
        self::assertFalse($relationship['liked']);
    }

    public function testUpdateRejectsInvalidData(): void
    {
        $logEntryId = $this->logMovie();

        $data = $this->requestJson('PATCH', '/api/log-entries/'.$logEntryId, ['rating' => 0, 'review' => '']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['rating', 'review'], array_column($data['violations'], 'propertyPath'));
    }

    public function testMemberCannotUpdateTheEntryOfSomeoneElse(): void
    {
        $logEntryId = $this->logMovie();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', '/api/log-entries/'.$logEntryId, ['liked' => true]);

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testUpdateRequiresAuthentication(): void
    {
        $this->requestJson('PATCH', '/api/log-entries/999999', ['liked' => true]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAuthorCanDeleteTheirEntryAndTheMovieStaysWatched(): void
    {
        $logEntryId = $this->logMovie(['rating' => 4, 'liked' => true]);

        $this->client->jsonRequest('DELETE', '/api/log-entries/'.$logEntryId);
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $this->requestJson('GET', '/api/log-entries/'.$logEntryId);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $relationship = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame(['watched' => true, 'liked' => true, 'rating' => 4, 'inWatchlist' => false], $relationship);
    }

    public function testMemberCannotDeleteTheEntryOfSomeoneElse(): void
    {
        $logEntryId = $this->logMovie();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', '/api/log-entries/'.$logEntryId);

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testDeleteRequiresAuthentication(): void
    {
        $this->requestJson('DELETE', '/api/log-entries/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testPublicFeedListsEntriesFromTheMostRecent(): void
    {
        $first = $this->logMovie();
        $second = $this->logMovie(['review' => 'Encore.']);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', '/api/log-entries');

        self::assertResponseIsSuccessful();
        self::assertSame([$second, $first], array_column($data['items'], 'id'));
        self::assertSame(2, $data['total']);
        self::assertSame(1, $data['lastPage']);
    }

    public function testPublicFeedIsPaginated(): void
    {
        $this->logMovie();
        $this->logMovie();
        $last = $this->logMovie();

        $data = $this->requestJson('GET', '/api/log-entries?page=1&limit=1');

        self::assertSame([$last], array_column($data['items'], 'id'));
        self::assertSame(3, $data['total']);
        self::assertSame(3, $data['lastPage']);
    }

    public function testPublicFeedCanBeFilteredByMovieUserAndReview(): void
    {
        $darkKnightId = $this->findId(Movie::class, ['tmdbId' => self::THE_DARK_KNIGHT]);
        $member = UserFactory::createOne();
        $reviewOfInception = $this->logMovie(['review' => 'Vertigineux.'], $member);
        $diaryOfDarkKnight = $this->logMovie([], $member, $darkKnightId);
        $reviewOfDarkKnight = $this->logMovie(['review' => 'Le Joker.', 'containsSpoilers' => true], movieId: $darkKnightId);

        $byMovie = $this->requestJson('GET', '/api/log-entries?movie='.$darkKnightId);
        self::assertSame([$reviewOfDarkKnight, $diaryOfDarkKnight], array_column($byMovie['items'], 'id'));

        $byUser = $this->requestJson('GET', '/api/log-entries?user='.$member->getUsername());
        self::assertSame([$diaryOfDarkKnight, $reviewOfInception], array_column($byUser['items'], 'id'));

        $reviews = $this->requestJson('GET', '/api/log-entries?withReview=true');
        self::assertSame([$reviewOfDarkKnight, $reviewOfInception], array_column($reviews['items'], 'id'));
        self::assertSame('Le Joker.', $reviews['items'][0]['review']);
        self::assertTrue($reviews['items'][0]['containsSpoilers']);

        $reviewsOfMemberOnDarkKnight = $this->requestJson('GET', '/api/log-entries?withReview=true&movie='.$darkKnightId.'&user='.$member->getUsername());
        self::assertSame([], $reviewsOfMemberOnDarkKnight['items']);
    }

    public function testPublicFeedRejectsInvalidFilters(): void
    {
        $data = $this->requestJson('GET', '/api/log-entries?movie=0&user=Not%20A%20Username');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['movie', 'user'], array_column($data['violations'], 'propertyPath'));
    }

    public function testPublicFeedRejectsAWithReviewThatIsNotABoolean(): void
    {
        $this->requestJson('GET', '/api/log-entries?withReview=maybe');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * Connecte un nouveau membre (ou celui donné) et journalise en son nom Inception ou le film donné.
     *
     * @param array<string, mixed> $payload
     */
    private function logMovie(array $payload = [], ?User $user = null, ?int $movieId = null): int
    {
        $this->loginAs($user ?? UserFactory::createOne());
        $data = $this->requestJson('POST', '/api/log-entries', $payload + ['movie' => $movieId ?? $this->movieId]);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }
}
