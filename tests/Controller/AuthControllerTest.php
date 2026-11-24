<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class AuthControllerTest extends ApiTestCase
{
    public function testVisitorCanRegister(): void
    {
        $data = $this->requestJson('POST', '/api/register', [
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'password' => 'secret-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame('jane@example.com', $data['email']);
        self::assertSame('jane_doe', $data['username']);
        self::assertArrayNotHasKey('password', $data);
    }

    /**
     * @param array<string, string> $payload
     */
    #[DataProvider('invalidRegistrationProvider')]
    public function testRegisterRejectsInvalidData(array $payload, string $invalidField): void
    {
        $data = $this->requestJson('POST', '/api/register', $payload + [
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'password' => 'secret-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame([$invalidField], array_column($data['violations'], 'propertyPath'));
    }

    /**
     * @return iterable<string, array{array<string, string>, string}>
     */
    public static function invalidRegistrationProvider(): iterable
    {
        yield 'malformed email' => [['email' => 'not-an-email'], 'email'];
        yield 'blank email' => [['email' => ''], 'email'];
        yield 'too short username' => [['username' => 'ab'], 'username'];
        yield 'too long username' => [['username' => str_repeat('a', 21)], 'username'];
        yield 'username with uppercase letters' => [['username' => 'Jane_Doe'], 'username'];
        yield 'username with forbidden characters' => [['username' => 'jane.doe'], 'username'];
        yield 'too short password' => [['password' => 'short'], 'password'];
    }

    public function testRegisterRejectsAnEmailAlreadyUsed(): void
    {
        UserFactory::createOne(['email' => 'jane@example.com']);

        $data = $this->requestJson('POST', '/api/register', [
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'password' => 'secret-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['email'], array_column($data['violations'], 'propertyPath'));
    }

    public function testRegisterRejectsAUsernameAlreadyTaken(): void
    {
        UserFactory::createOne(['username' => 'jane_doe']);

        $data = $this->requestJson('POST', '/api/register', [
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'password' => 'secret-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['username'], array_column($data['violations'], 'propertyPath'));
    }

    public function testMemberCanLoginAndReceivesTokenWithProfile(): void
    {
        UserFactory::createOne(['email' => 'jane@example.com', 'username' => 'jane_doe']);

        $data = $this->requestJson('POST', '/api/login_check', [
            'email' => 'jane@example.com',
            'password' => UserFactory::DEFAULT_PASSWORD,
        ]);

        self::assertResponseIsSuccessful();
        self::assertNotEmpty($data['token']);
        self::assertSame(3600, $data['ttl']);
        self::assertSame('jane_doe', $data['user']['username']);
        self::assertSame('jane@example.com', $data['user']['email']);
    }

    public function testLoginWithWrongPasswordIsUnauthorized(): void
    {
        UserFactory::createOne(['email' => 'jane@example.com']);

        $this->requestJson('POST', '/api/login_check', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testRegisteredMemberCanUseTheTokenReceivedAtLogin(): void
    {
        $this->requestJson('POST', '/api/register', [
            'email' => 'jane@example.com',
            'username' => 'jane_doe',
            'password' => 'secret-password',
        ]);
        $token = $this->requestJson('POST', '/api/login_check', [
            'email' => 'jane@example.com',
            'password' => 'secret-password',
        ])['token'];

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $data = $this->requestJson('GET', '/api/me');

        self::assertResponseIsSuccessful();
        self::assertSame('jane_doe', $data['username']);
    }
}
