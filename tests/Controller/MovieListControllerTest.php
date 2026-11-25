<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Entity\User;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class MovieListControllerTest extends ApiTestCase
{
    public function testMemberCanCreateAList(): void
    {
        $user = UserFactory::createOne(['username' => 'cobb']);
        $this->loginAs($user);

        $data = $this->requestJson('POST', '/api/lists', [
            'name' => 'Rêves imbriqués',
            'description' => 'Des films où la réalité vacille.',
            'ranked' => true,
            'public' => false,
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertIsInt($data['id']);
        self::assertSame(['id' => $user->getId(), 'username' => 'cobb'], $data['user']);
        self::assertSame('Rêves imbriqués', $data['name']);
        self::assertSame('Des films où la réalité vacille.', $data['description']);
        self::assertTrue($data['ranked']);
        self::assertFalse($data['public']);
        self::assertSame(0, $data['itemCount']);
        self::assertArrayHasKey('createdAt', $data);
    }

    public function testNewListIsPublicAndUnrankedByDefault(): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('POST', '/api/lists', ['name' => 'À voir à Noël']);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertNull($data['description']);
        self::assertFalse($data['ranked']);
        self::assertTrue($data['public']);
    }

    /**
     * @param array<string, mixed> $payload
     */
    #[DataProvider('provideInvalidCreatePayloads')]
    public function testCreateRejectsInvalidData(array $payload, string $expectedPropertyPath): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('POST', '/api/lists', $payload + ['name' => 'Ma liste']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$expectedPropertyPath], array_column($data['violations'], 'propertyPath'));
    }

    public static function provideInvalidCreatePayloads(): iterable
    {
        yield 'missing name' => [['name' => null], 'name'];
        yield 'blank name' => [['name' => '   '], 'name'];
        yield 'name too long' => [['name' => str_repeat('a', 101)], 'name'];
        yield 'blank description' => [['description' => ''], 'description'];
        yield 'description too long' => [['description' => str_repeat('a', 1001)], 'description'];
        yield 'ranked not a boolean' => [['ranked' => 'yes'], 'ranked'];
        yield 'public not a boolean' => [['public' => 'no'], 'public'];
    }

    public function testCreateRequiresAuthentication(): void
    {
        $this->requestJson('POST', '/api/lists', ['name' => 'Ma liste']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAnyoneCanReadAPublicList(): void
    {
        $movieListId = $this->createList(['name' => 'Nolan']);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', '/api/lists/'.$movieListId);

        self::assertResponseIsSuccessful();
        self::assertSame($movieListId, $data['id']);
        self::assertSame('Nolan', $data['name']);
    }

    public function testAuthorCanReadTheirPrivateList(): void
    {
        $movieListId = $this->createList(['public' => false]);

        $this->requestJson('GET', '/api/lists/'.$movieListId);

        self::assertResponseIsSuccessful();
    }

    public function testPrivateListIsNotFoundForOthers(): void
    {
        $movieListId = $this->createList(['public' => false]);

        $this->loginAs(UserFactory::createOne());
        $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testShowAnUnknownListReturnsNotFound(): void
    {
        $this->requestJson('GET', '/api/lists/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAuthorCanUpdateTheirList(): void
    {
        $movieListId = $this->createList(['name' => 'Nolan', 'description' => 'Ses films.']);

        $data = $this->requestJson('PATCH', '/api/lists/'.$movieListId, ['name' => 'Tout Nolan', 'ranked' => true, 'public' => false]);

        self::assertResponseIsSuccessful();
        self::assertSame('Tout Nolan', $data['name']);
        self::assertSame('Ses films.', $data['description']);
        self::assertTrue($data['ranked']);
        self::assertFalse($data['public']);
    }

    public function testUpdateWithNullRemovesTheDescription(): void
    {
        $movieListId = $this->createList(['description' => 'Ses films.']);

        $data = $this->requestJson('PATCH', '/api/lists/'.$movieListId, ['description' => null]);

        self::assertResponseIsSuccessful();
        self::assertNull($data['description']);
    }

    public function testUpdateRejectsInvalidData(): void
    {
        $movieListId = $this->createList();

        $data = $this->requestJson('PATCH', '/api/lists/'.$movieListId, ['name' => '', 'description' => ' ']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['name', 'description'], array_column($data['violations'], 'propertyPath'));
    }

    public function testMemberCannotUpdateThePublicListOfSomeoneElse(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', '/api/lists/'.$movieListId, ['name' => 'À moi']);

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testMemberCannotFindThePrivateListOfSomeoneElseToUpdateIt(): void
    {
        $movieListId = $this->createList(['public' => false]);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', '/api/lists/'.$movieListId, ['name' => 'À moi']);

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testUpdateRequiresAuthentication(): void
    {
        $this->requestJson('PATCH', '/api/lists/999999', ['name' => 'Ma liste']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAuthorCanDeleteTheirList(): void
    {
        $movieListId = $this->createList();

        $this->client->jsonRequest('DELETE', '/api/lists/'.$movieListId);
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testMemberCannotDeleteTheListOfSomeoneElse(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', '/api/lists/'.$movieListId);

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testDeleteRequiresAuthentication(): void
    {
        $this->requestJson('DELETE', '/api/lists/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testPublicListsAreListedFromTheMostRecent(): void
    {
        $first = $this->createList();
        $this->createList(['public' => false]);
        $last = $this->createList();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', '/api/lists');

        self::assertResponseIsSuccessful();
        self::assertSame([$last, $first], array_column($data['items'], 'id'));
        self::assertSame(2, $data['total']);
        self::assertSame(1, $data['lastPage']);
    }

    public function testAuthorDoesNotSeeTheirPrivateListsInTheSearch(): void
    {
        $author = UserFactory::createOne();
        $this->createList(['public' => false], $author);

        $data = $this->requestJson('GET', '/api/lists?user='.$author->getUsername());

        self::assertSame([], $data['items']);
    }

    public function testListsArePaginated(): void
    {
        $this->createList();
        $this->createList();
        $last = $this->createList();

        $data = $this->requestJson('GET', '/api/lists?page=1&limit=1');

        self::assertSame([$last], array_column($data['items'], 'id'));
        self::assertSame(3, $data['total']);
        self::assertSame(3, $data['lastPage']);
    }

    public function testListsCanBeSearchedByNameAndFilteredByUser(): void
    {
        $member = UserFactory::createOne();
        $nolanByMember = $this->createList(['name' => 'Tout Christopher Nolan'], $member);
        $horrorByMember = $this->createList(['name' => 'Horreur'], $member);
        $nolanByOther = $this->createList(['name' => 'Le meilleur de Nolan']);

        $byName = $this->requestJson('GET', '/api/lists?q=nolan');
        self::assertSame([$nolanByOther, $nolanByMember], array_column($byName['items'], 'id'));

        $byUser = $this->requestJson('GET', '/api/lists?user='.$member->getUsername());
        self::assertSame([$horrorByMember, $nolanByMember], array_column($byUser['items'], 'id'));

        $byNameAndUser = $this->requestJson('GET', '/api/lists?q=nolan&user='.$member->getUsername());
        self::assertSame([$nolanByMember], array_column($byNameAndUser['items'], 'id'));
    }

    public function testListsCanBeFilteredByMovie(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['tmdbId' => 27205]);
        $darkKnightId = $this->findId(Movie::class, ['tmdbId' => 155]);
        $withBoth = $this->createList();
        $this->requestJson('POST', '/api/lists/'.$withBoth.'/items', ['movie' => $inceptionId]);
        $this->requestJson('POST', '/api/lists/'.$withBoth.'/items', ['movie' => $darkKnightId]);
        $withDarkKnight = $this->createList();
        $this->requestJson('POST', '/api/lists/'.$withDarkKnight.'/items', ['movie' => $darkKnightId]);
        $this->createList();

        $data = $this->requestJson('GET', '/api/lists?movie='.$darkKnightId);

        self::assertSame([$withDarkKnight, $withBoth], array_column($data['items'], 'id'));
        self::assertSame([1, 2], array_column($data['items'], 'itemCount'));
    }

    public function testPopularListsAreSortedByLikeCount(): void
    {
        $likedTwice = $this->createList();
        $likedOnce = $this->createList();
        $unliked = $this->createList();
        foreach ([$likedTwice, $likedTwice, $likedOnce] as $movieListId) {
            $this->loginAs(UserFactory::createOne());
            $this->requestJson('POST', '/api/lists/'.$movieListId.'/like');
        }

        $popular = $this->requestJson('GET', '/api/lists?sort=popular');
        self::assertResponseIsSuccessful();
        self::assertSame([$likedTwice, $likedOnce, $unliked], array_column($popular['items'], 'id'));
        self::assertSame([2, 1, 0], array_column($popular['items'], 'likeCount'));

        $recent = $this->requestJson('GET', '/api/lists?sort=recent');
        self::assertSame([$unliked, $likedOnce, $likedTwice], array_column($recent['items'], 'id'));
    }

    public function testPopularListsWithTheSameLikeCountAreSortedFromTheMostRecent(): void
    {
        $first = $this->createList();
        $last = $this->createList();

        $data = $this->requestJson('GET', '/api/lists?sort=popular');

        self::assertSame([$last, $first], array_column($data['items'], 'id'));
    }

    public function testSearchRejectsInvalidFilters(): void
    {
        $data = $this->requestJson('GET', '/api/lists?movie=0&user=Not%20A%20Username');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['user', 'movie'], array_column($data['violations'], 'propertyPath'));
    }

    public function testSearchRejectsAnUnknownSort(): void
    {
        $this->requestJson('GET', '/api/lists?sort=liked');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * Connecte un nouveau membre (ou celui donné) et crée une liste en son nom.
     *
     * @param array<string, mixed> $payload
     */
    private function createList(array $payload = [], ?User $user = null): int
    {
        $this->loginAs($user ?? UserFactory::createOne());
        $data = $this->requestJson('POST', '/api/lists', $payload + ['name' => 'Ma liste']);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }
}
