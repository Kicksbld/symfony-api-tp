<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Entity\User;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class LogEntryCommentControllerTest extends ApiTestCase
{
    private User $reviewAuthor;

    private int $logEntryId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();

        $this->reviewAuthor = UserFactory::createOne(['username' => 'cobb']);
        $this->loginAs($this->reviewAuthor);
        $data = $this->requestJson('POST', '/api/log-entries', [
            'movie' => $this->findId(Movie::class, ['title' => 'Inception']),
            'review' => 'Un rêve dans un rêve.',
        ]);
        $this->logEntryId = $data['id'];
    }

    public function testMemberCanCommentALogEntry(): void
    {
        $arthur = UserFactory::createOne(['username' => 'arthur']);
        $this->loginAs($arthur);

        $data = $this->requestJson('POST', $this->commentsUri(), ['content' => 'La toupie tombe, non ?']);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertIsInt($data['id']);
        self::assertSame(['id' => $arthur->getId(), 'username' => 'arthur'], $data['user']);
        self::assertSame('La toupie tombe, non ?', $data['content']);
        self::assertArrayHasKey('createdAt', $data);

        $data = $this->requestJson('GET', '/api/log-entries/'.$this->logEntryId);
        self::assertSame(1, $data['commentCount']);
    }

    public function testCommentsArePaginatedFromOldestToNewest(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', $this->commentsUri(), ['content' => 'Premier']);
        $this->requestJson('POST', $this->commentsUri(), ['content' => 'Deuxième']);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $data = $this->requestJson('GET', $this->commentsUri().'?limit=1&page=2');

        self::assertResponseIsSuccessful();
        self::assertSame(2, $data['total']);
        self::assertSame(2, $data['lastPage']);
        self::assertSame(['Deuxième'], array_column($data['items'], 'content'));
    }

    #[DataProvider('provideInvalidContents')]
    public function testCommentRejectsInvalidContent(?string $content): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('POST', $this->commentsUri(), ['content' => $content]);
        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['content'], array_column($data['violations'], 'propertyPath'));

        $commentId = $this->comment();
        $data = $this->requestJson('PATCH', $this->commentUri($commentId), ['content' => $content]);
        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['content'], array_column($data['violations'], 'propertyPath'));
    }

    public static function provideInvalidContents(): iterable
    {
        yield 'missing' => [null];
        yield 'blank' => ['   '];
        yield 'too long' => [str_repeat('a', 1001)];
    }

    public function testCommentRequiresAuthentication(): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('POST', $this->commentsUri(), ['content' => 'Bravo']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCommentsOfAnUnknownLogEntryReturnNotFound(): void
    {
        $this->requestJson('GET', $this->commentsUri(999999));
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->requestJson('POST', $this->commentsUri(999999), ['content' => 'Bravo']);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAuthorCanUpdateTheirComment(): void
    {
        $commentId = $this->comment();

        $data = $this->requestJson('PATCH', $this->commentUri($commentId), ['content' => 'Finalement non.']);

        self::assertResponseIsSuccessful();
        self::assertSame($commentId, $data['id']);
        self::assertSame('Finalement non.', $data['content']);
    }

    public function testOnlyTheAuthorCanUpdateAComment(): void
    {
        $commentId = $this->comment();

        foreach ([$this->reviewAuthor, UserFactory::createOne()] as $user) {
            $this->loginAs($user);
            $this->requestJson('PATCH', $this->commentUri($commentId), ['content' => 'Modifié']);
            self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
        }

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->requestJson('PATCH', $this->commentUri($commentId), ['content' => 'Modifié']);
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAuthorCanDeleteTheirComment(): void
    {
        $commentId = $this->comment();

        $this->client->jsonRequest('DELETE', $this->commentUri($commentId));
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $data = $this->requestJson('GET', '/api/log-entries/'.$this->logEntryId);
        self::assertSame(0, $data['commentCount']);
    }

    public function testReviewAuthorCanDeleteACommentOnTheirReview(): void
    {
        $commentId = $this->comment();
        $this->loginAs($this->reviewAuthor);

        $this->client->jsonRequest('DELETE', $this->commentUri($commentId));

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
    }

    public function testOtherMembersCannotDeleteAComment(): void
    {
        $commentId = $this->comment();
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', $this->commentUri($commentId));
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->requestJson('DELETE', $this->commentUri($commentId));
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCommentOfAnotherLogEntryReturnsNotFound(): void
    {
        $commentId = $this->comment();
        $data = $this->requestJson('POST', '/api/log-entries', ['movie' => $this->findId(Movie::class, ['title' => 'Pulp Fiction'])]);

        $this->requestJson('PATCH', $this->commentUri($commentId, $data['id']), ['content' => 'Modifié']);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->requestJson('DELETE', $this->commentUri(999999));
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    /**
     * Commente la critique avec un nouveau membre, qui reste connecté.
     */
    private function comment(): int
    {
        $this->loginAs(UserFactory::createOne());
        $data = $this->requestJson('POST', $this->commentsUri(), ['content' => 'La toupie tombe, non ?']);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }

    private function commentUri(int $commentId, ?int $logEntryId = null): string
    {
        return $this->commentsUri($logEntryId).'/'.$commentId;
    }

    private function commentsUri(?int $logEntryId = null): string
    {
        return \sprintf('/api/log-entries/%d/comments', $logEntryId ?? $this->logEntryId);
    }
}
