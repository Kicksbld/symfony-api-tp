<?php

namespace App\Controller;

use App\Dto\CommentDto;
use App\Dto\PaginationDto;
use App\Entity\LogEntry;
use App\Entity\LogEntryComment;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\LogEntryCommentRepository;
use App\Security\Voter\CommentVoter;
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

#[Route('/api/log-entries/{id}/comments', name: 'api_log_entry_comments_', requirements: ['id' => Requirement::DIGITS])]
final class LogEntryCommentController extends AbstractController
{
    private const array GROUPS = ['comment:read'];

    public function __construct(
        private readonly CommentService $commentService,
        private readonly LogEntryCommentRepository $logEntryCommentRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        LogEntry $logEntry,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $comments = new Paginator()->paginate($this->logEntryCommentRepository->createByLogEntryQueryBuilder($logEntry), $paginationDto);

        return $this->json($comments, context: ['groups' => ['paginate', ...self::GROUPS]]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function create(
        LogEntry $logEntry,
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CommentDto $commentDto,
    ): JsonResponse {
        $comment = $this->commentService->commentLogEntry($user, $logEntry, $commentDto);

        return $this->json($comment, Response::HTTP_CREATED, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{commentId}', name: 'update', requirements: ['commentId' => Requirement::DIGITS], methods: ['PATCH'])]
    #[IsGranted(CommentVoter::EDIT, subject: 'comment')]
    public function update(
        #[MapEntity(mapping: ['commentId' => 'id', 'id' => 'logEntry'])] LogEntryComment $comment,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CommentDto $commentDto,
    ): JsonResponse {
        $comment = $this->commentService->update($comment, $commentDto);

        return $this->json($comment, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{commentId}', name: 'delete', requirements: ['commentId' => Requirement::DIGITS], methods: ['DELETE'])]
    #[IsGranted(CommentVoter::DELETE, subject: 'comment')]
    public function delete(#[MapEntity(mapping: ['commentId' => 'id', 'id' => 'logEntry'])] LogEntryComment $comment): Response
    {
        $this->commentService->delete($comment);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
