<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;

final class CountryControllerTest extends ApiTestCase
{
    public function testListReturnsTheProductionCountriesSortedByName(): void
    {
        $this->importMovieCatalog();

        $data = $this->requestJson('GET', '/api/countries');

        self::assertResponseIsSuccessful();
        self::assertSame([
            ['code' => 'GB', 'name' => 'United Kingdom'],
            ['code' => 'US', 'name' => 'United States of America'],
        ], $data['items']);
    }
}
