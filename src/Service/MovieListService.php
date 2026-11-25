<?php

namespace App\Service;

use App\Dto\CreateMovieListDto;
use App\Dto\CreateMovieListItemDto;
use App\Dto\UpdateMovieListDto;
use App\Dto\UpdateMovieListItemDto;
use App\Entity\Movie;
use App\Entity\MovieList;
use App\Entity\MovieListItem;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final readonly class MovieListService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private EntityValidator $entityValidator,
    ) {
    }

    public function create(User $user, CreateMovieListDto $createMovieListDto): MovieList
    {
        $movieList = new MovieList($user)
            ->setName($createMovieListDto->name)
            ->setDescription($createMovieListDto->description)
            ->setRanked($createMovieListDto->ranked)
            ->setPublic($createMovieListDto->public);

        $this->entityManager->persist($movieList);
        $this->entityManager->flush();

        return $movieList;
    }

    /**
     * @param list<string> $sentFields champs présents dans le corps de la requête
     */
    public function update(MovieList $movieList, UpdateMovieListDto $updateMovieListDto, array $sentFields): MovieList
    {
        if (null !== $updateMovieListDto->name) {
            $movieList->setName($updateMovieListDto->name);
        }
        if (\in_array('description', $sentFields, true)) {
            $movieList->setDescription($updateMovieListDto->description);
        }
        if (null !== $updateMovieListDto->ranked) {
            $movieList->setRanked($updateMovieListDto->ranked);
        }
        if (null !== $updateMovieListDto->public) {
            $movieList->setPublic($updateMovieListDto->public);
        }

        $this->entityManager->flush();

        return $movieList;
    }

    public function delete(MovieList $movieList): void
    {
        $this->entityManager->remove($movieList);
        $this->entityManager->flush();
    }

    public function addItem(MovieList $movieList, CreateMovieListItemDto $createMovieListItemDto): MovieListItem
    {
        $movie = $this->entityManager->getReference(Movie::class, $createMovieListItemDto->movie);
        $movieListItem = $movieList->addItem($movie)->setNote($createMovieListItemDto->note);

        $this->entityValidator->validate($movieListItem);

        $this->entityManager->persist($movieListItem);
        $this->entityManager->flush();

        return $movieListItem;
    }

    /**
     * @param list<string> $sentFields champs présents dans le corps de la requête
     */
    public function updateItem(MovieListItem $movieListItem, UpdateMovieListItemDto $updateMovieListItemDto, array $sentFields): MovieListItem
    {
        if (null !== $updateMovieListItemDto->position) {
            $movieListItem->getMovieList()->moveItem($movieListItem, $updateMovieListItemDto->position);
        }
        if (\in_array('note', $sentFields, true)) {
            $movieListItem->setNote($updateMovieListItemDto->note);
        }

        $this->entityManager->flush();

        return $movieListItem;
    }

    public function removeItem(MovieListItem $movieListItem): void
    {
        $movieListItem->getMovieList()->removeItem($movieListItem);
        $this->entityManager->flush();
    }
}
