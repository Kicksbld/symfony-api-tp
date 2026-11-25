<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class MovieListLikeControllerTest extends ApiTestCase
{
    public function testMemberCanLikeAPublicList(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());

        $listUri = '/api/lists/'.$movieListId;
        self::assertFalse($this->requestJson('GET', $listUri)['likedByMe']);

        $data = $this->requestJson('POST', $this->likeUri($movieListId));

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame($movieListId, $data['id']);
        self::assertSame(1, $data['likeCount']);
        self::assertTrue($data['likedByMe']);
        self::assertTrue($this->requestJson('GET', $listUri)['likedByMe']);
        foreach (['/api/lists', '/api/users/cobb/lists'] as $uri) {
            self::assertTrue($this->requestJson('GET', $uri)['items'][0]['likedByMe']);
        }

        $this->loginAs(UserFactory::createOne());
        self::assertFalse($this->requestJson('GET', $listUri)['likedByMe']);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $data = $this->requestJson('GET', $listUri);
        self::assertSame(1, $data['likeCount']);
        self::assertFalse($data['likedByMe']);
        foreach (['/api/lists', '/api/users/cobb/lists'] as $uri) {
            self::assertFalse($this->requestJson('GET', $uri)['items'][0]['likedByMe']);
        }
    }

    public function testLikingTheSameListTwiceReturnsConflict(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', $this->likeUri($movieListId));

        $this->requestJson('POST', $this->likeUri($movieListId));

        self::assertResponseStatusCodeSame(Response::HTTP_CONFLICT);
    }

    public function testPrivateListOfAnotherMemberCannotBeLiked(): void
    {
        $movieListId = $this->createList(['public' => false]);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('POST', $this->likeUri($movieListId));

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testMemberCanUnlikeAList(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', $this->likeUri($movieListId));

        $this->client->jsonRequest('DELETE', $this->likeUri($movieListId));
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $data = $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertSame(0, $data['likeCount']);
        self::assertFalse($data['likedByMe']);
    }

    public function testUnlikeAListNotLikedReturnsNotFound(): void
    {
        $movieListId = $this->createList();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', $this->likeUri($movieListId));

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testLikeRequiresAuthentication(): void
    {
        $movieListId = $this->createList();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('POST', $this->likeUri($movieListId));
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);

        $this->requestJson('DELETE', $this->likeUri($movieListId));
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createList(array $payload = []): int
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $data = $this->requestJson('POST', '/api/lists', $payload + ['name' => 'Tout Nolan']);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }

    private function likeUri(int $movieListId): string
    {
        return \sprintf('/api/lists/%d/like', $movieListId);
    }
}
