<?php

namespace App\Controller;

use App\Dto\DiaryFilterDto;
use App\Dto\PaginationDto;
use App\Dto\UserSearchDto;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\LogEntryRepository;
use App\Repository\MovieListRepository;
use App\Repository\MovieRelationshipRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/users', name: 'api_users_')]
final class UserController extends AbstractController
{
    private const array MOVIE_RELATIONSHIP_GROUPS = ['paginate', 'movieRelationship:read', 'movieRelationship:list'];

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly LogEntryRepository $logEntryRepository,
        private readonly MovieRelationshipRepository $movieRelationshipRepository,
        private readonly MovieListRepository $movieListRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UserSearchDto $userSearchDto = new UserSearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $users = new Paginator()->paginate($this->userRepository->createSearchQueryBuilder($userSearchDto), $paginationDto);

        return $this->json($users, context: ['groups' => ['paginate', 'user:list']]);
    }

    #[Route('/{username:user}', name: 'show', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        return $this->json($user, context: ['groups' => ['user:read']]);
    }

    #[Route('/{username:user}/diary', name: 'diary', methods: ['GET'])]
    public function diary(
        User $user,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] DiaryFilterDto $diaryFilterDto = new DiaryFilterDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $logEntries = new Paginator()->paginate($this->logEntryRepository->createDiaryQueryBuilder($user, $diaryFilterDto), $paginationDto);

        return $this->json($logEntries, context: ['groups' => ['paginate', 'logEntry:read']]);
    }

    #[Route('/{username:user}/watched', name: 'watched', methods: ['GET'])]
    public function watched(
        User $user,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movieRelationships = new Paginator()->paginate($this->movieRelationshipRepository->createWatchedQueryBuilder($user), $paginationDto);

        return $this->json($movieRelationships, context: ['groups' => self::MOVIE_RELATIONSHIP_GROUPS]);
    }

    #[Route('/{username:user}/likes', name: 'likes', methods: ['GET'])]
    public function likes(
        User $user,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movieRelationships = new Paginator()->paginate($this->movieRelationshipRepository->createLikedQueryBuilder($user), $paginationDto);

        return $this->json($movieRelationships, context: ['groups' => self::MOVIE_RELATIONSHIP_GROUPS]);
    }

    #[Route('/{username:user}/watchlist', name: 'watchlist', methods: ['GET'])]
    public function watchlist(
        User $user,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $movieRelationships = new Paginator()->paginate($this->movieRelationshipRepository->createWatchlistQueryBuilder($user), $paginationDto);

        return $this->json($movieRelationships, context: ['groups' => self::MOVIE_RELATIONSHIP_GROUPS]);
    }

    #[Route('/{username:user}/lists', name: 'lists', methods: ['GET'])]
    public function lists(
        User $user,
        #[CurrentUser] ?User $currentUser,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $queryBuilder = $this->movieListRepository->createByUserQueryBuilder($user, withPrivate: $user === $currentUser);
        $movieLists = new Paginator()->paginate($queryBuilder, $paginationDto);

        return $this->json($movieLists, context: ['groups' => ['paginate', 'movieList:read']]);
    }
}
