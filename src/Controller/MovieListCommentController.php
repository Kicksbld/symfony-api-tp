<?php

namespace App\Controller;

use App\Dto\CommentDto;
use App\Dto\PaginationDto;
use App\Entity\MovieList;
use App\Entity\MovieListComment;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\MovieListCommentRepository;
use App\Security\Voter\CommentVoter;
use App\Security\Voter\MovieListVoter;
use App\Service\CommentService;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Mêmes règles d'accès que MovieListController : les commentaires d'une liste privée renvoient 404 aux autres membres.
 */
#[Route('/api/lists/{id}/comments', name: 'api_list_comments_', requirements: ['id' => Requirement::DIGITS])]
#[IsGranted(MovieListVoter::VIEW, subject: 'movieList', message: 'List not found.', statusCode: Response::HTTP_NOT_FOUND)]
final class MovieListCommentController extends AbstractController
{
    private const array GROUPS = ['comment:read'];

    public function __construct(
        private readonly CommentService $commentService,
        private readonly MovieListCommentRepository $movieListCommentRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        MovieList $movieList,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $comments = new Paginator()->paginate($this->movieListCommentRepository->createByMovieListQueryBuilder($movieList), $paginationDto);

        return $this->json($comments, context: ['groups' => ['paginate', ...self::GROUPS]]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function create(
        MovieList $movieList,
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CommentDto $commentDto,
    ): JsonResponse {
        $comment = $this->commentService->commentMovieList($user, $movieList, $commentDto);

        return $this->json($comment, Response::HTTP_CREATED, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{commentId}', name: 'update', requirements: ['commentId' => Requirement::DIGITS], methods: ['PATCH'])]
    #[IsGranted(CommentVoter::EDIT, subject: 'comment')]
    public function update(
        MovieList $movieList,
        #[MapEntity(mapping: ['commentId' => 'id', 'id' => 'movieList'])] MovieListComment $comment,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CommentDto $commentDto,
    ): JsonResponse {
        $comment = $this->commentService->update($comment, $commentDto);

        return $this->json($comment, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{commentId}', name: 'delete', requirements: ['commentId' => Requirement::DIGITS], methods: ['DELETE'])]
    #[IsGranted(CommentVoter::DELETE, subject: 'comment')]
    public function delete(
        MovieList $movieList,
        #[MapEntity(mapping: ['commentId' => 'id', 'id' => 'movieList'])] MovieListComment $comment,
    ): Response {
        $this->commentService->delete($comment);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
