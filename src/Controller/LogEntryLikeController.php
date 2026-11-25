<?php

namespace App\Controller;

use App\Entity\LogEntry;
use App\Entity\User;
use App\Service\LikeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/log-entries/{id}/like', name: 'api_log_entry_likes_', requirements: ['id' => Requirement::DIGITS])]
#[IsGranted('IS_AUTHENTICATED')]
final class LogEntryLikeController extends AbstractController
{
    public function __construct(private readonly LikeService $likeService)
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(LogEntry $logEntry, #[CurrentUser] User $user): JsonResponse
    {
        $this->likeService->likeLogEntry($user, $logEntry);

        return $this->json($logEntry, Response::HTTP_CREATED, context: ['groups' => ['logEntry:read']]);
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(LogEntry $logEntry, #[CurrentUser] User $user): Response
    {
        $this->likeService->unlikeLogEntry($user, $logEntry);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
