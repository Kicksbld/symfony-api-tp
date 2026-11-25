<?php

namespace App\Service;

use App\Dto\CreateLogEntryDto;
use App\Dto\UpdateLogEntryDto;
use App\Entity\LogEntry;
use App\Entity\Movie;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final readonly class LogEntryService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MovieRelationshipService $movieRelationshipService,
    ) {
    }

    public function create(User $user, CreateLogEntryDto $createLogEntryDto): LogEntry
    {
        $movie = $this->entityManager->getReference(Movie::class, $createLogEntryDto->movie);

        $logEntry = new LogEntry($user, $movie)
            ->setWatchedOn($createLogEntryDto->watchedOn)
            ->setRating($createLogEntryDto->rating)
            ->setLiked($createLogEntryDto->liked)
            ->setRewatch($createLogEntryDto->rewatch)
            ->setReview($createLogEntryDto->review)
            ->setContainsSpoilers($createLogEntryDto->containsSpoilers);
        $this->entityManager->persist($logEntry);

        $movieRelationship = $this->movieRelationshipService->findOrNew($user, $movie)->recordLogEntry($logEntry);
        $this->movieRelationshipService->save($movieRelationship, null !== $logEntry->getRating());

        return $logEntry;
    }

    /**
     * @param list<string> $sentFields champs présents dans le corps de la requête
     */
    public function update(LogEntry $logEntry, UpdateLogEntryDto $updateLogEntryDto, array $sentFields): LogEntry
    {
        if (\in_array('watchedOn', $sentFields, true)) {
            $logEntry->setWatchedOn($updateLogEntryDto->watchedOn);
        }
        if (\in_array('rating', $sentFields, true)) {
            $logEntry->setRating($updateLogEntryDto->rating);
        }
        if (\in_array('review', $sentFields, true)) {
            $logEntry->setReview($updateLogEntryDto->review);
        }
        if (null !== $updateLogEntryDto->liked) {
            $logEntry->setLiked($updateLogEntryDto->liked);
        }
        if (null !== $updateLogEntryDto->rewatch) {
            $logEntry->setRewatch($updateLogEntryDto->rewatch);
        }
        if (null !== $updateLogEntryDto->containsSpoilers) {
            $logEntry->setContainsSpoilers($updateLogEntryDto->containsSpoilers);
        }

        $this->entityManager->flush();

        return $logEntry;
    }

    public function delete(LogEntry $logEntry): void
    {
        $this->entityManager->remove($logEntry);
        $this->entityManager->flush();
    }
}
