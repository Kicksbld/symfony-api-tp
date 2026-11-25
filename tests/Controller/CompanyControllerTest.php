<?php

namespace App\Tests\Controller;

use App\Entity\Company;
use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\Response;

final class CompanyControllerTest extends ApiTestCase
{
    public function testShowReturnsTheCompany(): void
    {
        $this->importMovieCatalog();
        $syncopyId = $this->findId(Company::class, ['name' => 'Syncopy']);

        $data = $this->requestJson('GET', '/api/companies/'.$syncopyId);

        self::assertResponseIsSuccessful();
        self::assertSame([
            'id' => $syncopyId,
            'name' => 'Syncopy',
            'logoUrl' => 'https://image.tmdb.org/t/p/w92/3tvBqYsBhxWeHlu62SIJ1el93O7.png',
        ], $data);
    }

    public function testShowReturnsNotFoundForAnUnknownCompany(): void
    {
        $data = $this->requestJson('GET', '/api/companies/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertSame(Response::HTTP_NOT_FOUND, $data['status']);
    }
}
