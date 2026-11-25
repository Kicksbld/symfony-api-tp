<?php

namespace App\Controller;

use App\Dto\PaginationDto;
use App\Dto\WatchRegionDto;
use App\Model\Paginator;
use App\Repository\WatchProviderRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/watch-providers', name: 'api_watch_providers_')]
final class WatchProviderController extends AbstractController
{
    public function __construct(private readonly WatchProviderRepository $watchProviderRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] WatchRegionDto $watchRegionDto = new WatchRegionDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $queryBuilder = $this->watchProviderRepository->createByRegionQueryBuilder($watchRegionDto->region);
        $watchProviders = new Paginator()->paginate($queryBuilder, $paginationDto);

        return $this->json($watchProviders, context: ['groups' => ['paginate', 'watchProvider:read']]);
    }
}
