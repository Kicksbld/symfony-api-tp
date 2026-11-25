<?php

namespace App\Controller;

use App\Dto\MovieSearchDto;
use App\Dto\PaginationDto;
use App\Dto\WatchRegionDto;
use App\Entity\Movie;
use App\Model\Paginator;
use App\Repository\MovieRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

#[Route('/api/movies', name: 'api_movies_')]
final class MovieController extends AbstractController
{
    public function __construct(private readonly MovieRepository $movieRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] MovieSearchDto $movieSearchDto = new MovieSearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movies = new Paginator()->paginate($this->movieRepository->createSearchQueryBuilder($movieSearchDto), $paginationDto);

        return $this->json($movies, context: ['groups' => ['paginate', 'movie:list']]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function show(Movie $movie): JsonResponse
    {
        return $this->json($movie, context: ['groups' => ['movie:read']]);
    }

    #[Route('/{id}/watch-providers', name: 'watch_providers', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function watchProviders(
        Movie $movie,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] WatchRegionDto $watchRegionDto = new WatchRegionDto(),
    ): JsonResponse {
        return $this->json($movie->getWatchProvidersByType($watchRegionDto->region), context: ['groups' => ['watchProvider:read']]);
    }
}
