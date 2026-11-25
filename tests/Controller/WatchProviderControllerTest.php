<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\Response;

final class WatchProviderControllerTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
    }

    public function testListReturnsTheProvidersAvailableInFranceByDefault(): void
    {
        $data = $this->requestJson('GET', '/api/watch-providers?limit=3');

        self::assertResponseIsSuccessful();
        self::assertSame(['ARTE VOD', 'Amazon Video', 'Apple TV Store'], array_column($data['items'], 'name'));
        self::assertSame(['id', 'name', 'logoUrl'], array_keys($data['items'][0]));
        self::assertSame(15, $data['total']);
        self::assertSame(5, $data['lastPage']);
    }

    public function testListCanBeAskedForAnotherRegion(): void
    {
        $data = $this->requestJson('GET', '/api/watch-providers?region=BE');

        self::assertSame(
            ['Amazon Prime Video', 'Amazon Video', 'Apple TV Store', 'HBO Max', 'HBO Max Amazon Channel', 'Netflix', 'Rakuten TV'],
            array_column($data['items'], 'name'),
        );
    }

    public function testListRejectsAnUnsupportedRegion(): void
    {
        $data = $this->requestJson('GET', '/api/watch-providers?region=JP');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['region'], array_column($data['violations'], 'propertyPath'));
    }
}
