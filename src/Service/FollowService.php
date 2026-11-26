<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final readonly class FollowService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
    ) {
    }

    /**
     * @return array<int, true>
     */
    public function getFollowedUserIdSet(?User $follower, User ...$users): array
    {
        if (null === $follower || [] === $users) {
            return [];
        }

        $ids = array_map(static fn (User $user): int => $user->getId(), $users);

        return array_fill_keys($this->userRepository->findFollowedIds($follower, $ids), true);
    }

    public function follow(User $follower, User $followed): void
    {
        if ($follower === $followed) {
            throw new UnprocessableEntityHttpException('You cannot follow yourself.');
        }
        if ($follower->isFollowing($followed)) {
            throw new ConflictHttpException('You already follow this member.');
        }

        $follower->follow($followed);
        $this->entityManager->flush();
    }

    public function unfollow(User $follower, User $followed): void
    {
        if (!$follower->isFollowing($followed)) {
            throw new NotFoundHttpException('You do not follow this member.');
        }

        $follower->unfollow($followed);
        $this->entityManager->flush();
    }
}
