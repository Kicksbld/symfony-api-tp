<?php

namespace App\Service;

use App\Dto\UpdateMovieRelationshipDto;
use App\Entity\Movie;
use App\Entity\MovieRelationship;
use App\Entity\User;
use App\Model\RatingDistribution;
use App\Repository\MovieRelationshipRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class MovieRelationshipService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MovieRelationshipRepository $movieRelationshipRepository,
    ) {
    }

    // Sans relation enregistrée, on renvoie une relation vierge non persistée : elle n'est créée qu'à la première modification.
    public function findOrNew(User $user, Movie $movie): MovieRelationship
    {
        return $this->movieRelationshipRepository->findOneByUserAndMovie($user, $movie) ?? new MovieRelationship($user, $movie);
    }

    public function update(User $user, Movie $movie, UpdateMovieRelationshipDto $updateMovieRelationshipDto, bool $ratingSent): MovieRelationship
    {
        $movieRelationship = $this->findOrNew($user, $movie);

        if (null !== $updateMovieRelationshipDto->watched) {
            $movieRelationship->setWatched($updateMovieRelationshipDto->watched);
        }
        if (null !== $updateMovieRelationshipDto->liked) {
            $movieRelationship->setLiked($updateMovieRelationshipDto->liked);
        }
        if ($ratingSent) {
            $movieRelationship->setRating($updateMovieRelationshipDto->rating);
        }
        if (null !== $updateMovieRelationshipDto->inWatchlist) {
            $movieRelationship->setInWatchlist($updateMovieRelationshipDto->inWatchlist);
        }

        $this->save($movieRelationship, $ratingSent);

        return $movieRelationship;
    }

    /**
     * Enregistre la relation avec tout ce qui attend d'être enregistré, puis recalcule la moyenne du film si la note a changé.
     * La moyenne se calcule en base, donc après l'enregistrement de la nouvelle note, dans la même transaction.
     */
    public function save(MovieRelationship $movieRelationship, bool $ratingChanged): void
    {
        $this->entityManager->wrapInTransaction(function () use ($movieRelationship, $ratingChanged): void {
            $this->entityManager->persist($movieRelationship);
            $this->entityManager->flush();

            if ($ratingChanged) {
                $movie = $movieRelationship->getMovie();
                $movie->updateRatings($this->getRatingDistribution($movie));
            }
        });
    }

    public function getRatingDistribution(Movie $movie): RatingDistribution
    {
        return new RatingDistribution($this->movieRelationshipRepository->countRatingsByValue($movie));
    }
}
