<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\Response;

final class FrontControllerTest extends ApiTestCase
{
    public function testTheReactShellIsServedOnTheHomePage(): void
    {
        $this->client->request('GET', '/');

        self::assertResponseIsSuccessful();
        self::assertSelectorExists('#root');
    }

    // Recharger une page du front doit renvoyer la coquille : le routage est fait par React.
    public function testTheReactShellIsServedOnAnyFrontPage(): void
    {
        $this->client->request('GET', '/movies/12');

        self::assertResponseIsSuccessful();
        self::assertSelectorExists('#root');
    }

    public function testUnknownApiRoutesStillAnswerInJson(): void
    {
        $data = $this->requestJson('GET', '/api/unknown');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertResponseFormatSame('json');
        self::assertSame(404, $data['status']);
    }
}
