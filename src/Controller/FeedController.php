<?php

namespace App\Controller;

use App\Dto\PaginationDto;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\LogEntryRepository;
use App\Serializer\SocialStateNormalizer;
use App\Service\LikeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/feed', name: 'api_feed_')]
#[IsGranted('IS_AUTHENTICATED')]
final class FeedController extends AbstractController
{
    public function __construct(
        private readonly LogEntryRepository $logEntryRepository,
        private readonly LikeService $likeService,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $logEntries = new Paginator()->paginate($this->logEntryRepository->createFeedQueryBuilder($user), $paginationDto);

        return $this->json($logEntries, context: [
            'groups' => ['paginate', 'logEntry:read'],
            SocialStateNormalizer::LIKED_IDS => $this->likeService->getLikedLogEntryIdSet($user, ...$logEntries->items),
        ]);
    }
}
