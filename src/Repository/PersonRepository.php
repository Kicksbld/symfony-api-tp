<?php

namespace App\Repository;

use App\Dto\PersonSearchDto;
use App\Entity\Person;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Person>
 */
class PersonRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Person::class);
    }

    public function createSearchQueryBuilder(PersonSearchDto $personSearchDto): QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('person');

        if (null !== $personSearchDto->q) {
            $queryBuilder
                ->andWhere('person.name LIKE :q')
                ->setParameter('q', '%'.$personSearchDto->q.'%');
        }

        return $queryBuilder
            ->orderBy('person.name', 'ASC')
            ->addOrderBy('person.id', 'ASC');
    }

    // Charge les crédits et leurs films en une seule requête, du film le plus récent au plus ancien.
    public function findWithFilmography(int $id): ?Person
    {
        return $this->createQueryBuilder('person')
            ->addSelect('credit', 'movie')
            ->leftJoin('person.credits', 'credit')
            ->leftJoin('credit.movie', 'movie')
            ->andWhere('person.id = :id')
            ->setParameter('id', $id)
            ->orderBy('movie.releaseDate', 'DESC')
            ->addOrderBy('movie.id', 'ASC')
            ->addOrderBy('credit.position', 'ASC')
            ->getQuery()
            ->getOneOrNullResult();
    }
}
