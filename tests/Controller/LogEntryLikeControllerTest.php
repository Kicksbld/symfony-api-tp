<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class LogEntryLikeControllerTest extends ApiTestCase
{
    private int $logEntryId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();

        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $data = $this->requestJson('POST', '/api/log-entries', [
            'movie' => $this->findId(Movie::class, ['title' => 'Inception']),
            'review' => 'Un rêve dans un rêve.',
            'watchedOn' => '2026-11-20',
        ]);
        $this->logEntryId = $data['id'];
    }

    public function testMemberCanLikeALogEntry(): void
    {
        $this->loginAs(UserFactory::createOne());

        $entryUri = '/api/log-entries/'.$this->logEntryId;
        self::assertFalse($this->requestJson('GET', $entryUri)['likedByMe']);

        $data = $this->requestJson('POST', $this->likeUri());

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame($this->logEntryId, $data['id']);
        self::assertSame(1, $data['likeCount']);
        self::assertTrue($data['likedByMe']);
        self::assertTrue($this->requestJson('GET', $entryUri)['likedByMe']);

        foreach (['/api/log-entries', '/api/users/cobb/diary'] as $uri) {
            self::assertTrue($this->requestJson('GET', $uri)['items'][0]['likedByMe']);
        }

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $data = $this->requestJson('GET', $entryUri);
        self::assertSame(1, $data['likeCount']);
        self::assertFalse($data['likedByMe']);
        foreach (['/api/log-entries', '/api/users/cobb/diary'] as $uri) {
            self::assertFalse($this->requestJson('GET', $uri)['items'][0]['likedByMe']);
        }
    }

    public function testLikingTheSameLogEntryTwiceReturnsConflict(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', $this->likeUri());

        $data = $this->requestJson('POST', $this->likeUri());

        self::assertResponseStatusCodeSame(Response::HTTP_CONFLICT);
        self::assertSame(Response::HTTP_CONFLICT, $data['status']);
    }

    public function testMemberCanUnlikeALogEntry(): void
    {
        $this->loginAs(UserFactory::createOne());
        $this->requestJson('POST', $this->likeUri());

        $this->client->jsonRequest('DELETE', $this->likeUri());
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $data = $this->requestJson('GET', '/api/log-entries/'.$this->logEntryId);
        self::assertSame(0, $data['likeCount']);
        self::assertFalse($data['likedByMe']);
    }

    public function testUnlikeALogEntryNotLikedReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', $this->likeUri());

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testLikeAnUnknownLogEntryReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('POST', $this->likeUri(999999));

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testLikeRequiresAuthentication(): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('POST', $this->likeUri());
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);

        $this->requestJson('DELETE', $this->likeUri());
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    private function likeUri(?int $logEntryId = null): string
    {
        return \sprintf('/api/log-entries/%d/like', $logEntryId ?? $this->logEntryId);
    }
}
