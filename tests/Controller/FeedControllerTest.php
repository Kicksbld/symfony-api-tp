<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class FeedControllerTest extends ApiTestCase
{
    public function testFeedRequiresAuthentication(): void
    {
        $this->requestJson('GET', '/api/feed');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testFeedListsTheLogEntriesOfFollowedMembersFromTheMostRecent(): void
    {
        $this->importMovieCatalog();
        $inceptionId = $this->findId(Movie::class, ['originalTitle' => 'Inception']);
        $cobb = UserFactory::createOne(['username' => 'cobb']);
        $arthur = UserFactory::createOne(['username' => 'arthur']);
        $ariadne = UserFactory::createOne(['username' => 'ariadne']);
        $saito = UserFactory::createOne(['username' => 'saito']);

        $this->loginAs($arthur);
        $arthurEntry = $this->logMovie($inceptionId);
        $this->loginAs($ariadne);
        $ariadneEntry = $this->logMovie($inceptionId);
        $this->loginAs($saito);
        $this->logMovie($inceptionId);
        $this->loginAs($cobb);
        $this->logMovie($inceptionId);
        $this->requestJson('POST', '/api/users/arthur/followers');
        $this->requestJson('POST', '/api/users/ariadne/followers');
        $this->requestJson('POST', '/api/log-entries/'.$arthurEntry.'/like');

        $data = $this->requestJson('GET', '/api/feed?limit=20');

        self::assertResponseIsSuccessful();
        self::assertSame(2, $data['total']);
        self::assertSame([$ariadneEntry, $arthurEntry], array_column($data['items'], 'id'));
        self::assertSame([false, true], array_column($data['items'], 'likedByMe'));
        self::assertSame('ariadne', $data['items'][0]['user']['username']);
    }

    public function testFeedIsEmptyWhenFollowingNobody(): void
    {
        $this->loginAs(UserFactory::createOne());

        $data = $this->requestJson('GET', '/api/feed');

        self::assertResponseIsSuccessful();
        self::assertSame(['items' => [], 'total' => 0, 'lastPage' => 1], $data);
    }

    public function testFeedRejectsAnInvalidPage(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('GET', '/api/feed?page=0');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function logMovie(int $movieId): int
    {
        return $this->requestJson('POST', '/api/log-entries', ['movie' => $movieId])['id'];
    }
}
