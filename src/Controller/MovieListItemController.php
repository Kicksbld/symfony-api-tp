<?php

namespace App\Controller;

use App\Dto\CreateMovieListItemDto;
use App\Dto\PaginationDto;
use App\Dto\UpdateMovieListItemDto;
use App\Entity\MovieList;
use App\Entity\MovieListItem;
use App\Model\Paginator;
use App\Repository\MovieListItemRepository;
use App\Security\Voter\MovieListVoter;
use App\Service\MovieListService;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Mêmes règles d'accès que MovieListController : 404 sur la liste privée d'un autre, 403 sur sa liste publique.
 */
#[Route('/api/lists/{id}/items', name: 'api_list_items_', requirements: ['id' => Requirement::DIGITS])]
#[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
final class MovieListItemController extends AbstractController
{
    private const array GROUPS = ['movieListItem:read'];

    public function __construct(
        private readonly MovieListService $movieListService,
        private readonly MovieListItemRepository $movieListItemRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        MovieList $movieList,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movieListItems = new Paginator()->paginate($this->movieListItemRepository->createByMovieListQueryBuilder($movieList), $paginationDto);

        return $this->json($movieListItems, context: ['groups' => ['paginate', ...self::GROUPS]]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted(MovieListVoter::EDIT, subject: 'movieList')]
    public function create(
        MovieList $movieList,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CreateMovieListItemDto $createMovieListItemDto,
    ): JsonResponse {
        $movieListItem = $this->movieListService->addItem($movieList, $createMovieListItemDto);

        return $this->json($movieListItem, Response::HTTP_CREATED, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{itemId}', name: 'update', requirements: ['itemId' => Requirement::DIGITS], methods: ['PATCH'])]
    #[IsGranted(MovieListVoter::EDIT, subject: 'movieList')]
    public function update(
        MovieList $movieList,
        #[MapEntity(mapping: ['itemId' => 'id', 'id' => 'movieList'])] MovieListItem $movieListItem,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UpdateMovieListItemDto $updateMovieListItemDto,
        Request $request,
    ): JsonResponse {
        // Dans le DTO, une note absente et une note à null valent toutes les deux null : seul le corps de la requête
        // permet de savoir si le membre veut l'effacer.
        $sentFields = array_keys($request->getPayload()->all());
        $movieListItem = $this->movieListService->updateItem($movieListItem, $updateMovieListItemDto, $sentFields);

        return $this->json($movieListItem, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{itemId}', name: 'delete', requirements: ['itemId' => Requirement::DIGITS], methods: ['DELETE'])]
    #[IsGranted(MovieListVoter::EDIT, subject: 'movieList')]
    public function delete(
        MovieList $movieList,
        #[MapEntity(mapping: ['itemId' => 'id', 'id' => 'movieList'])] MovieListItem $movieListItem,
    ): Response {
        $this->movieListService->removeItem($movieListItem);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
