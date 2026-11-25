<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class MeControllerTest extends ApiTestCase
{
    public function testShowProfileRequiresAuthentication(): void
    {
        $data = $this->requestJson('GET', '/api/me');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
        self::assertResponseFormatSame('json');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $data['code']);
    }

    public function testMemberCanSeeTheirProfile(): void
    {
        $user = UserFactory::createOne(['email' => 'jane@example.com', 'username' => 'jane_doe', 'bio' => 'Cinephile.']);
        $this->loginAs($user);

        $data = $this->requestJson('GET', '/api/me');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'id' => $user->getId(),
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'bio' => 'Cinephile.',
            'favorites' => [],
            'watchedCount' => 0,
        ], $data);
    }

    public function testMemberCanUpdateTheirUsernameAndBio(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'jane_doe']));

        $this->requestJson('PATCH', '/api/me', ['username' => 'jane_films', 'bio' => 'Mostly horror movies.']);
        self::assertResponseIsSuccessful();

        $data = $this->requestJson('GET', '/api/me');
        self::assertSame('jane_films', $data['username']);
        self::assertSame('Mostly horror movies.', $data['bio']);
    }

    public function testUpdateOnlyChangesTheFieldsSent(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'jane_doe', 'bio' => 'Cinephile.']));

        $data = $this->requestJson('PATCH', '/api/me', ['bio' => 'New bio.']);

        self::assertResponseIsSuccessful();
        self::assertSame('jane_doe', $data['username']);
        self::assertSame('New bio.', $data['bio']);
    }

    public function testMemberCanClearTheirBioWithAnEmptyString(): void
    {
        $this->loginAs(UserFactory::createOne(['bio' => 'Cinephile.']));

        $data = $this->requestJson('PATCH', '/api/me', ['bio' => '']);

        self::assertResponseIsSuccessful();
        self::assertNull($data['bio']);
    }

    public function testMemberCanResendTheirCurrentUsername(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'jane_doe']));

        $this->requestJson('PATCH', '/api/me', ['username' => 'jane_doe']);

        self::assertResponseIsSuccessful();
    }

    public function testUpdateRejectsAUsernameAlreadyTaken(): void
    {
        UserFactory::createOne(['username' => 'john_doe']);
        $this->loginAs(UserFactory::createOne(['username' => 'jane_doe']));

        $data = $this->requestJson('PATCH', '/api/me', ['username' => 'john_doe']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['username'], array_column($data['violations'], 'propertyPath'));
    }

    public function testUpdateRejectsInvalidData(): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('PATCH', '/api/me', ['username' => 'Jane Doe', 'bio' => str_repeat('a', 501)]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['username', 'bio'], array_column($data['violations'], 'propertyPath'));
    }

    public function testUpdateProfileRequiresAuthentication(): void
    {
        $this->requestJson('PATCH', '/api/me', ['bio' => 'New bio.']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMemberCanReplaceTheirFavoritesInTheChosenOrder(): void
    {
        $this->importMovieCatalog();
        $pulpFictionId = $this->findId(Movie::class, ['originalTitle' => 'Pulp Fiction']);
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $darkKnightId = $this->findId(Movie::class, ['originalTitle' => 'The Dark Knight']);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PUT', '/api/me/favorites', ['movies' => [$inceptionId, $darkKnightId]]);
        $data = $this->requestJson('PUT', '/api/me/favorites', ['movies' => [$pulpFictionId, $inceptionId]]);

        self::assertResponseIsSuccessful();
        self::assertSame([$pulpFictionId, $inceptionId], array_column($data, 'id'));
        self::assertSame([$pulpFictionId, $inceptionId], array_column($this->requestJson('GET', '/api/me')['favorites'], 'id'));
    }

    public function testMemberCanRemoveAllTheirFavorites(): void
    {
        $this->importMovieCatalog();
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('PUT', '/api/me/favorites', ['movies' => [$this->findId(Movie::class, ['originalTitle' => 'Inception'])]]);

        $data = $this->requestJson('PUT', '/api/me/favorites', ['movies' => []]);

        self::assertResponseIsSuccessful();
        self::assertSame([], $data);
    }

    /**
     * @param array<string, mixed> $payload
     */
    #[DataProvider('provideInvalidFavoritesPayloads')]
    public function testReplaceFavoritesRejectsInvalidData(array $payload, string $expectedPropertyPath): void
    {
        $this->importMovieCatalog();
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('PUT', '/api/me/favorites', $payload);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$expectedPropertyPath], array_unique(array_column($data['violations'], 'propertyPath')));
    }

    public static function provideInvalidFavoritesPayloads(): iterable
    {
        yield 'missing movies' => [[], 'movies'];
        yield 'more than four movies' => [['movies' => [1, 2, 3, 4, 5]], 'movies'];
        yield 'duplicate movie' => [['movies' => [1, 1]], 'movies'];
        yield 'unknown movie' => [['movies' => [999999]], 'movies[0]'];
        yield 'not an identifier' => [['movies' => ['inception']], 'movies[0]'];
    }

    public function testReplaceFavoritesRequiresAuthentication(): void
    {
        $this->requestJson('PUT', '/api/me/favorites', ['movies' => []]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
