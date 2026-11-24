<?php

namespace App\Controller;

use App\Dto\UpdateProfileDto;
use App\Entity\User;
use App\Service\AccountService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me', name: 'api_me_')]
#[IsGranted('IS_AUTHENTICATED')]
final class MeController extends AbstractController
{
    public function __construct(private readonly AccountService $accountService)
    {
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json($user, context: ['groups' => User::PRIVATE_PROFILE_GROUPS]);
    }

    #[Route('', name: 'update', methods: ['PATCH'])]
    public function update(
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UpdateProfileDto $updateProfileDto,
    ): JsonResponse {
        $user = $this->accountService->updateProfile($user, $updateProfileDto);

        return $this->json($user, context: ['groups' => User::PRIVATE_PROFILE_GROUPS]);
    }
}
