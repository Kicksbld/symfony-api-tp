<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\FollowService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users/{username:user}/follow', name: 'api_follows_')]
#[IsGranted('IS_AUTHENTICATED')]
final class FollowController extends AbstractController
{
    public function __construct(private readonly FollowService $followService)
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(User $user, #[CurrentUser] User $currentUser): Response
    {
        $this->followService->follow($currentUser, $user);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(User $user, #[CurrentUser] User $currentUser): Response
    {
        $this->followService->unfollow($currentUser, $user);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
