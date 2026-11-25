<?php

namespace App\Controller;

use App\Entity\MovieList;
use App\Entity\User;
use App\Security\Voter\MovieListVoter;
use App\Serializer\SocialStateNormalizer;
use App\Service\LikeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/lists/{id}/like', name: 'api_list_likes_', requirements: ['id' => Requirement::DIGITS])]
#[IsGranted('IS_AUTHENTICATED')]
#[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
final class MovieListLikeController extends AbstractController
{
    public function __construct(private readonly LikeService $likeService)
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(MovieList $movieList, #[CurrentUser] User $user): JsonResponse
    {
        $this->likeService->likeMovieList($user, $movieList);

        return $this->json($movieList, Response::HTTP_CREATED, context: [
            'groups' => ['movieList:read'],
            SocialStateNormalizer::LIKED_IDS => [$movieList->getId() => true],
        ]);
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(MovieList $movieList, #[CurrentUser] User $user): Response
    {
        $this->likeService->unlikeMovieList($user, $movieList);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
