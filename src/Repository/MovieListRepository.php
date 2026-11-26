<?php

namespace App\Repository;

use App\Dto\MovieListSearchDto;
use App\Entity\MovieList;
use App\Entity\MovieListLike;
use App\Entity\User;
use App\Enum\MovieListSort;
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
        $queryBuilder = $this->createCardQueryBuilder()->andWhere('movieList.public = true');

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

        if (MovieListSort::Popular === $movieListSearchDto->sort) {
            $this->orderByLikeCount($queryBuilder);
        }

        return $this->orderByMostRecent($queryBuilder);
    }

    /**
     * Les listes privées ne sont ajoutées que lorsque c'est leur auteur qui consulte son profil.
     */
    public function createByUserQueryBuilder(User $user, bool $withPrivate): QueryBuilder
    {
        $queryBuilder = $this->createCardQueryBuilder()
            ->andWhere('movieList.user = :user')
            ->setParameter('user', $user);

        if (!$withPrivate) {
            $queryBuilder->andWhere('movieList.public = true');
        }

        return $this->orderByMostRecent($queryBuilder);
    }

    // L'auteur et les films sont joints pour sérialiser l'aperçu des affiches sans une requête par liste.
    private function createCardQueryBuilder(): QueryBuilder
    {
        return $this->createQueryBuilder('movieList')
            ->addSelect('user', 'previewItem', 'previewMovie')
            ->innerJoin('movieList.user', 'user')
            ->leftJoin('movieList.items', 'previewItem')
            ->leftJoin('previewItem.movie', 'previewMovie');
    }

    // Nombre de likes en sous-requête pour ne pas grouper la requête paginée. À égalité, les plus récentes d'abord.
    private function orderByLikeCount(QueryBuilder $queryBuilder): void
    {
        $queryBuilder
            ->addSelect(\sprintf(
                '(SELECT COUNT(movieListLike.id) FROM %s movieListLike WHERE movieListLike.movieList = movieList) AS HIDDEN likeCount',
                MovieListLike::class,
            ))
            ->orderBy('likeCount', 'DESC');
    }

    // Complète le tri déjà posé, s'il y en a un. Plusieurs listes peuvent être créées dans la même seconde :
    // l'identifiant départage.
    private function orderByMostRecent(QueryBuilder $queryBuilder): QueryBuilder
    {
        return $queryBuilder
            ->addOrderBy('movieList.createdAt', 'DESC')
            ->addOrderBy('movieList.id', 'DESC');
    }
}
