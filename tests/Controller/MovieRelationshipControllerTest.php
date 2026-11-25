<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class MovieRelationshipControllerTest extends ApiTestCase
{
    private const int INCEPTION = 27205;

    private int $movieId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
        $this->movieId = $this->findId(Movie::class, ['tmdbId' => self::INCEPTION]);
    }

    public function testRelationshipHasDefaultValuesBeforeAnyChange(): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'watched' => false,
            'liked' => false,
            'rating' => null,
            'inWatchlist' => false,
        ], $data);
    }

    public function testShowRelationshipRequiresAuthentication(): void
    {
        $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMemberCanUpdateTheirRelationship(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', [
            'watched' => true,
            'liked' => true,
            'rating' => 4.5,
            'inWatchlist' => true,
        ]);
        self::assertResponseIsSuccessful();

        $data = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');
        self::assertSame([
            'watched' => true,
            'liked' => true,
            'rating' => 4.5,
            'inWatchlist' => true,
        ], $data);
    }

    public function testUpdateOnlyChangesTheFieldsSent(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['liked' => true, 'rating' => 3]);

        $data = $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['watched' => true]);

        self::assertResponseIsSuccessful();
        self::assertSame([
            'watched' => true,
            'liked' => true,
            'rating' => 3,
            'inWatchlist' => false,
        ], $data);
    }

    public function testMemberCanRemoveTheirRatingWithNull(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['rating' => 2.5]);

        $data = $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['rating' => null]);

        self::assertResponseIsSuccessful();
        self::assertNull($data['rating']);
    }

    public function testEachMemberHasTheirOwnRelationship(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['liked' => true]);

        $this->loginAs(UserFactory::createOne());
        $data = $this->requestJson('GET', '/api/movies/'.$this->movieId.'/relationship');

        self::assertFalse($data['liked']);
    }

    /**
     * @param array<string, mixed> $payload
     */
    #[DataProvider('provideInvalidPayloads')]
    public function testUpdateRejectsInvalidData(array $payload, string $expectedPropertyPath): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', $payload);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$expectedPropertyPath], array_column($data['violations'], 'propertyPath'));
    }

    public static function provideInvalidPayloads(): iterable
    {
        yield 'rating too low' => [['rating' => 0], 'rating'];
        yield 'rating too high' => [['rating' => 5.5], 'rating'];
        yield 'rating not a half star' => [['rating' => 3.7], 'rating'];
        yield 'not a boolean' => [['watched' => 'yes'], 'watched'];
    }

    public function testUpdateRelationshipRequiresAuthentication(): void
    {
        $this->requestJson('PATCH', '/api/movies/'.$this->movieId.'/relationship', ['liked' => true]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAuthenticationIsCheckedBeforeTheMovieExists(): void
    {
        $this->requestJson('GET', '/api/movies/999999/relationship');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testUpdateRelationshipOfAnUnknownMovieReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', '/api/movies/999999/relationship', ['liked' => true]);

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testShowRelationshipOfAnUnknownMovieReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('GET', '/api/movies/999999/relationship');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }
}
