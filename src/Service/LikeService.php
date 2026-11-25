<?php

namespace App\Service;

use App\Entity\LogEntry;
use App\Entity\LogEntryLike;
use App\Entity\MovieList;
use App\Entity\MovieListLike;
use App\Entity\User;
use App\Repository\LogEntryLikeRepository;
use App\Repository\MovieListLikeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final readonly class LikeService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private LogEntryLikeRepository $logEntryLikeRepository,
        private MovieListLikeRepository $movieListLikeRepository,
    ) {
    }

    /**
     * @return array<int, true>
     */
    public function getLikedLogEntryIdSet(?User $user, LogEntry ...$logEntries): array
    {
        if (null === $user || [] === $logEntries) {
            return [];
        }

        $ids = array_map(static fn (LogEntry $entry): int => $entry->getId(), $logEntries);

        return array_fill_keys($this->logEntryLikeRepository->findLikedIds($user, $ids), true);
    }

    /**
     * @return array<int, true>
     */
    public function getLikedMovieListIdSet(?User $user, MovieList ...$movieLists): array
    {
        if (null === $user || [] === $movieLists) {
            return [];
        }

        $ids = array_map(static fn (MovieList $list): int => $list->getId(), $movieLists);

        return array_fill_keys($this->movieListLikeRepository->findLikedIds($user, $ids), true);
    }

    public function likeLogEntry(User $user, LogEntry $logEntry): void
    {
        if (null !== $this->logEntryLikeRepository->findOneBy(['user' => $user, 'logEntry' => $logEntry])) {
            throw new ConflictHttpException('You already like this log entry.');
        }

        $this->entityManager->persist(new LogEntryLike($user, $logEntry));
        $this->entityManager->flush();
    }

    public function unlikeLogEntry(User $user, LogEntry $logEntry): void
    {
        $logEntryLike = $this->logEntryLikeRepository->findOneBy(['user' => $user, 'logEntry' => $logEntry])
            ?? throw new NotFoundHttpException('You do not like this log entry.');

        $this->entityManager->remove($logEntryLike);
        $this->entityManager->flush();
    }

    public function likeMovieList(User $user, MovieList $movieList): void
    {
        if (null !== $this->movieListLikeRepository->findOneBy(['user' => $user, 'movieList' => $movieList])) {
            throw new ConflictHttpException('You already like this list.');
        }

        $this->entityManager->persist(new MovieListLike($user, $movieList));
        $this->entityManager->flush();
    }

    public function unlikeMovieList(User $user, MovieList $movieList): void
    {
        $movieListLike = $this->movieListLikeRepository->findOneBy(['user' => $user, 'movieList' => $movieList])
            ?? throw new NotFoundHttpException('You do not like this list.');

        $this->entityManager->remove($movieListLike);
        $this->entityManager->flush();
    }
}
