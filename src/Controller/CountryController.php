<?php

namespace App\Controller;

use App\Dto\PaginationDto;
use App\Model\Paginator;
use App\Repository\CountryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/countries', name: 'api_countries_')]
final class CountryController extends AbstractController
{
    public function __construct(private readonly CountryRepository $countryRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $countries = new Paginator()->paginate($this->countryRepository->createAlphabeticalQueryBuilder(), $paginationDto);

        return $this->json($countries, context: ['groups' => ['paginate', 'country:read']]);
    }
}
