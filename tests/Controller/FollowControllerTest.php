<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class FollowControllerTest extends ApiTestCase
{
    public function testFollowRequiresAuthentication(): void
    {
        UserFactory::createOne(['username' => 'arthur']);

        $this->requestJson('POST', '/api/users/arthur/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMemberCanFollowAnotherMember(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        $arthur = UserFactory::createOne(['username' => 'arthur']);

        $followed = $this->requestJson('POST', '/api/users/arthur/follow');
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame(['id' => $arthur->getId(), 'username' => 'arthur'], $followed);

        $arthur = $this->requestJson('GET', '/api/users/arthur');
        self::assertSame(1, $arthur['followersCount']);
        self::assertSame(0, $arthur['followingCount']);

        $cobb = $this->requestJson('GET', '/api/users/cobb');
        self::assertSame(0, $cobb['followersCount']);
        self::assertSame(1, $cobb['followingCount']);
    }

    public function testFollowingTheSameMemberTwiceReturnsConflict(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        UserFactory::createOne(['username' => 'arthur']);
        $this->requestJson('POST', '/api/users/arthur/follow');

        $data = $this->requestJson('POST', '/api/users/arthur/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_CONFLICT);
        self::assertSame(Response::HTTP_CONFLICT, $data['status']);
    }

    public function testMemberCannotFollowThemselves(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));

        $this->requestJson('POST', '/api/users/cobb/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function testFollowAnUnknownMemberReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('POST', '/api/users/nobody/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testMemberCanUnfollowAMember(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        UserFactory::createOne(['username' => 'arthur']);
        $this->requestJson('POST', '/api/users/arthur/follow');

        $this->client->jsonRequest('DELETE', '/api/users/arthur/follow');
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $arthur = $this->requestJson('GET', '/api/users/arthur');
        self::assertSame(0, $arthur['followersCount']);
    }

    public function testUnfollowAMemberNotFollowedReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne(['username' => 'cobb']));
        UserFactory::createOne(['username' => 'arthur']);

        $this->requestJson('DELETE', '/api/users/arthur/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testUnfollowAnUnknownMemberReturnsNotFound(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('DELETE', '/api/users/nobody/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testUnfollowRequiresAuthentication(): void
    {
        UserFactory::createOne(['username' => 'arthur']);

        $this->requestJson('DELETE', '/api/users/arthur/follow');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testFollowersAndFollowingArePaginatedByUsername(): void
    {
        $cobb = UserFactory::createOne(['username' => 'cobb']);
        $ariadne = UserFactory::createOne(['username' => 'ariadne']);
        $arthur = UserFactory::createOne(['username' => 'arthur']);
        UserFactory::createOne(['username' => 'saito']);
        foreach ([$ariadne, $arthur] as $follower) {
            $this->loginAs($follower);
            $this->requestJson('POST', '/api/users/cobb/follow');
        }
        $this->loginAs($cobb);
        $this->requestJson('POST', '/api/users/saito/follow');
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $followers = $this->requestJson('GET', '/api/users/cobb/followers?limit=1');
        self::assertResponseIsSuccessful();
        self::assertSame(2, $followers['total']);
        self::assertSame(2, $followers['lastPage']);
        self::assertSame([['id' => $ariadne->getId(), 'username' => 'ariadne']], $followers['items']);

        $following = $this->requestJson('GET', '/api/users/cobb/following');
        self::assertSame(['saito'], array_column($following['items'], 'username'));
    }
}
