<?php

namespace App\Tests\Controller;

use App\Entity\User;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class MovieListCommentControllerTest extends ApiTestCase
{
    private User $listAuthor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->listAuthor = UserFactory::createOne(['username' => 'cobb']);
    }

    public function testMemberCanCommentAPublicList(): void
    {
        $movieListId = $this->createList();
        $arthur = UserFactory::createOne(['username' => 'arthur']);
        $this->loginAs($arthur);

        $data = $this->requestJson('POST', $this->commentsUri($movieListId), ['content' => 'Il manque Memento.']);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame(['id' => $arthur->getId(), 'username' => 'arthur'], $data['user']);
        self::assertSame('Il manque Memento.', $data['content']);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $data = $this->requestJson('GET', $this->commentsUri($movieListId));
        self::assertResponseIsSuccessful();
        self::assertSame(['Il manque Memento.'], array_column($data['items'], 'content'));

        $data = $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertSame(1, $data['commentCount']);
    }

    public function testCommentRejectsInvalidContent(): void
    {
        $movieListId = $this->createList();

        $data = $this->requestJson('POST', $this->commentsUri($movieListId), ['content' => str_repeat('a', 1001)]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['content'], array_column($data['violations'], 'propertyPath'));
    }

    public function testCommentsOfAPrivateListAreNotFoundForOthers(): void
    {
        $movieListId = $this->createList(['public' => false]);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('GET', $this->commentsUri($movieListId));
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->requestJson('POST', $this->commentsUri($movieListId), ['content' => 'Bravo']);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testCommentRequiresAuthentication(): void
    {
        $movieListId = $this->createList();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('POST', $this->commentsUri($movieListId), ['content' => 'Bravo']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testOnlyTheAuthorCanUpdateAComment(): void
    {
        $movieListId = $this->createList();
        $commentId = $this->comment($movieListId);

        $data = $this->requestJson('PATCH', $this->commentUri($movieListId, $commentId), ['content' => 'Et Le Prestige.']);
        self::assertResponseIsSuccessful();
        self::assertSame('Et Le Prestige.', $data['content']);

        $this->loginAs($this->listAuthor);
        $this->requestJson('PATCH', $this->commentUri($movieListId, $commentId), ['content' => 'Modifié']);
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testListAuthorCanDeleteACommentOnTheirList(): void
    {
        $movieListId = $this->createList();
        $commentId = $this->comment($movieListId);
        $this->loginAs($this->listAuthor);

        $this->client->jsonRequest('DELETE', $this->commentUri($movieListId, $commentId));
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $data = $this->requestJson('GET', '/api/lists/'.$movieListId);
        self::assertSame(0, $data['commentCount']);
    }

    public function testOtherMembersCannotDeleteAComment(): void
    {
        $movieListId = $this->createList();
        $commentId = $this->comment($movieListId);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', $this->commentUri($movieListId, $commentId));

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createList(array $payload = []): int
    {
        $this->loginAs($this->listAuthor);
        $data = $this->requestJson('POST', '/api/lists', $payload + ['name' => 'Tout Nolan']);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }

    /**
     * Commente la liste avec un nouveau membre, qui reste connecté.
     */
    private function comment(int $movieListId): int
    {
        $this->loginAs(UserFactory::createOne());
        $data = $this->requestJson('POST', $this->commentsUri($movieListId), ['content' => 'Il manque Memento.']);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }

    private function commentUri(int $movieListId, int $commentId): string
    {
        return $this->commentsUri($movieListId).'/'.$commentId;
    }

    private function commentsUri(int $movieListId): string
    {
        return \sprintf('/api/lists/%d/comments', $movieListId);
    }
}
