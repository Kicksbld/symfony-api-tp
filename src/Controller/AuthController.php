<?php

namespace App\Controller;

use App\Dto\RegisterDto;
use App\Entity\User;
use App\Service\AccountService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(private readonly AccountService $accountService)
    {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] RegisterDto $registerDto,
    ): JsonResponse {
        $user = $this->accountService->register($registerDto);

        return $this->json($user, Response::HTTP_CREATED, [], ['groups' => User::PRIVATE_PROFILE_GROUPS]);
    }
}
