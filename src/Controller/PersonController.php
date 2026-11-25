<?php

namespace App\Controller;

use App\Dto\PaginationDto;
use App\Dto\PersonMovieSearchDto;
use App\Dto\PersonSearchDto;
use App\Entity\Person;
use App\Model\Paginator;
use App\Repository\MovieRepository;
use App\Repository\PersonRepository;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

#[Route('/api/people', name: 'api_people_')]
final class PersonController extends AbstractController
{
    public function __construct(
        private readonly PersonRepository $personRepository,
        private readonly MovieRepository $movieRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PersonSearchDto $personSearchDto = new PersonSearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $people = new Paginator()->paginate($this->personRepository->createSearchQueryBuilder($personSearchDto), $paginationDto);

        return $this->json($people, context: ['groups' => ['paginate', 'person:list']]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function show(#[MapEntity(expr: 'repository.findWithFilmography(id)')] Person $person): JsonResponse
    {
        return $this->json($person, context: ['groups' => ['person:read']]);
    }

    #[Route('/{id}/movies', name: 'movies', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function movies(
        Person $person,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PersonMovieSearchDto $personMovieSearchDto = new PersonMovieSearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movies = new Paginator()->paginate($this->movieRepository->createFilmographyQueryBuilder($person, $personMovieSearchDto), $paginationDto);

        return $this->json($movies, context: ['groups' => ['paginate', 'movie:list']]);
    }
}
