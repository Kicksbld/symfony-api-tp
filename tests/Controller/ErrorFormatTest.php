<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\Response;

final class ErrorFormatTest extends ApiTestCase
{
    public function testValidationErrorsAreJsonWithoutAcceptHeader(): void
    {
        $this->client->request('POST', '/api/register', server: ['CONTENT_TYPE' => 'application/json'], content: '{"email": "not-an-email"}');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertResponseFormatSame('json');
    }

    public function testUnknownApiRouteReturnsJsonNotFound(): void
    {
        $this->client->request('GET', '/api/unknown');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertResponseFormatSame('json');
    }
}
