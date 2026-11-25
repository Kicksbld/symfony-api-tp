<?php

namespace App\Controller;

use App\Entity\User;
use App\Serializer\SocialStateNormalizer;
use App\Service\FollowService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users/{username:followed}/followers', name: 'api_follows_')]
#[IsGranted('IS_AUTHENTICATED')]
final class FollowController extends AbstractController
{
    public function __construct(private readonly FollowService $followService)
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(User $followed, #[CurrentUser] User $user): JsonResponse
    {
        $this->followService->follow($user, $followed);

        return $this->json($followed, Response::HTTP_CREATED, context: [
            'groups' => ['user:list'],
            SocialStateNormalizer::FOLLOWED_BY_ME => true,
        ]);
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(User $followed, #[CurrentUser] User $user): Response
    {
        $this->followService->unfollow($user, $followed);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
