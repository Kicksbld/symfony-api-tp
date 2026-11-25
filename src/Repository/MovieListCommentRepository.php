<?php

namespace App\Repository;

use App\Entity\MovieList;
use App\Entity\MovieListComment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovieListComment>
 */
class MovieListCommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovieListComment::class);
    }

    // Comme une conversation, du plus ancien au plus récent. L'auteur est joint pour être sérialisé sans une requête
    // par commentaire, et l'identifiant départage les commentaires postés dans la même seconde.
    public function createByMovieListQueryBuilder(MovieList $movieList): QueryBuilder
    {
        return $this->createQueryBuilder('comment')
            ->addSelect('user')
            ->innerJoin('comment.user', 'user')
            ->andWhere('comment.movieList = :movieList')
            ->setParameter('movieList', $movieList)
            ->orderBy('comment.createdAt', 'ASC')
            ->addOrderBy('comment.id', 'ASC');
    }
}
