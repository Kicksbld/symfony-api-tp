<?php

namespace App\Repository;

use App\Entity\MovieList;
use App\Entity\MovieListItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovieListItem>
 */
class MovieListItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovieListItem::class);
    }

    public function createByMovieListQueryBuilder(MovieList $movieList): QueryBuilder
    {
        // Le film est joint pour être sérialisé sans une requête par élément.
        return $this->createQueryBuilder('item')
            ->addSelect('movie')
            ->innerJoin('item.movie', 'movie')
            ->andWhere('item.movieList = :movieList')
            ->setParameter('movieList', $movieList)
            ->orderBy('item.position', 'ASC');
    }
}
