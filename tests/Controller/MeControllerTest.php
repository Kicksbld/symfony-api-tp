<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
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
}
