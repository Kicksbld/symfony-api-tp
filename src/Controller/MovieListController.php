<?php

namespace App\Controller;

use App\Dto\CreateMovieListDto;
use App\Dto\MovieListSearchDto;
use App\Dto\PaginationDto;
use App\Dto\UpdateMovieListDto;
use App\Entity\MovieList;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\MovieListRepository;
use App\Security\Voter\MovieListVoter;
use App\Serializer\SocialStateNormalizer;
use App\Service\LikeService;
use App\Service\MovieListService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Une liste privée renvoie 404 à tout autre que son auteur, pour ne pas révéler qu'elle existe. La 403 n'est donnée
 * que sur une liste publique qu'on n'a pas le droit de modifier.
 */
#[Route('/api/lists', name: 'api_lists_')]
final class MovieListController extends AbstractController
{
    private const array GROUPS = ['movieList:read'];

    public function __construct(
        private readonly MovieListService $movieListService,
        private readonly MovieListRepository $movieListRepository,
        private readonly LikeService $likeService,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[CurrentUser] ?User $viewer,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] MovieListSearchDto $movieListSearchDto = new MovieListSearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movieLists = new Paginator()->paginate($this->movieListRepository->createSearchQueryBuilder($movieListSearchDto), $paginationDto);

        return $this->json($movieLists, context: [
            'groups' => ['paginate', ...self::GROUPS],
            SocialStateNormalizer::LIKED_IDS => $this->likeService->getLikedMovieListIdSet($viewer, ...$movieLists->items),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CreateMovieListDto $createMovieListDto,
    ): JsonResponse {
        $movieList = $this->movieListService->create($user, $createMovieListDto);

        return $this->json($movieList, Response::HTTP_CREATED, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    #[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
    public function show(MovieList $movieList, #[CurrentUser] ?User $viewer): JsonResponse
    {
        return $this->json($movieList, context: [
            'groups' => self::GROUPS,
            SocialStateNormalizer::LIKED_IDS => $this->likeService->getLikedMovieListIdSet($viewer, $movieList),
        ]);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::DIGITS], methods: ['PATCH'])]
    #[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
    #[IsGranted(MovieListVoter::EDIT, subject: 'movieList')]
    public function update(
        MovieList $movieList,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UpdateMovieListDto $updateMovieListDto,
        Request $request,
    ): JsonResponse {
        // Dans le DTO, une description absente et une description à null valent toutes les deux null : seul le corps
        // de la requête permet de savoir si le membre veut l'effacer.
        $sentFields = array_keys($request->getPayload()->all());
        $movieList = $this->movieListService->update($movieList, $updateMovieListDto, $sentFields);

        return $this->json($movieList, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => Requirement::DIGITS], methods: ['DELETE'])]
    #[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
    #[IsGranted(MovieListVoter::EDIT, subject: 'movieList')]
    public function delete(MovieList $movieList): Response
    {
        $this->movieListService->delete($movieList);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
