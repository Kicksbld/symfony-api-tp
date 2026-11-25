<?php

namespace App\Repository;

use App\Dto\MovieListSearchDto;
use App\Entity\MovieList;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovieList>
 */
class MovieListRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovieList::class);
    }

    /**
     * Seules les listes publiques sont cherchées, y compris pour leur auteur.
     */
    public function createSearchQueryBuilder(MovieListSearchDto $movieListSearchDto): QueryBuilder
    {
        // L'auteur est joint pour être sérialisé sans une requête par liste.
        $queryBuilder = $this->createQueryBuilder('movieList')
            ->addSelect('user')
            ->innerJoin('movieList.user', 'user')
            ->andWhere('movieList.public = true');

        // LIKE ignore déjà la casse sous SQLite. LOWER() n'y gère que l'ASCII et casserait les noms accentués.
        if (null !== $movieListSearchDto->q) {
            $queryBuilder
                ->andWhere('movieList.name LIKE :q')
                ->setParameter('q', '%'.$movieListSearchDto->q.'%');
        }

        if (null !== $movieListSearchDto->user) {
            $queryBuilder
                ->andWhere('user.username = :username')
                ->setParameter('username', $movieListSearchDto->user);
        }

        // Un film n'apparaît qu'une fois par liste : la jointure ne crée pas de doublon.
        if (null !== $movieListSearchDto->movie) {
            $queryBuilder
                ->innerJoin('movieList.items', 'item', 'WITH', 'item.movie = :movie')
                ->setParameter('movie', $movieListSearchDto->movie);
        }

        // Plusieurs listes peuvent être créées dans la même seconde : l'identifiant départage.
        return $queryBuilder
            ->orderBy('movieList.createdAt', 'DESC')
            ->addOrderBy('movieList.id', 'DESC');
    }
}
