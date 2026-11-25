<?php

namespace App\Controller;

use App\Dto\PaginationDto;
use App\Model\Paginator;
use App\Repository\GenreRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/genres', name: 'api_genres_')]
final class GenreController extends AbstractController
{
    public function __construct(private readonly GenreRepository $genreRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $genres = new Paginator()->paginate($this->genreRepository->createAlphabeticalQueryBuilder(), $paginationDto);

        return $this->json($genres, context: ['groups' => ['paginate', 'genre:read']]);
    }
}
