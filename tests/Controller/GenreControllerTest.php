<?php

namespace App\Tests\Controller;

use App\Tests\ApiTestCase;

final class GenreControllerTest extends ApiTestCase
{
    public function testListReturnsTheGenresSortedByName(): void
    {
        $this->importMovieCatalog();

        $data = $this->requestJson('GET', '/api/genres');

        self::assertResponseIsSuccessful();
        self::assertSame(['Action', 'Comédie', 'Crime', 'Science-Fiction', 'Thriller'], array_column($data['items'], 'name'));
        self::assertSame(['id', 'name'], array_keys($data['items'][0]));
        self::assertSame(5, $data['total']);
    }
}
