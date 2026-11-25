<?php

namespace App\Repository;

use App\Entity\LogEntryLike;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LogEntryLike>
 */
class LogEntryLikeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LogEntryLike::class);
    }

    /**
     * @param list<int> $logEntryIds
     *
     * @return list<int>
     */
    public function findLikedIds(User $user, array $logEntryIds): array
    {
        return $this->createQueryBuilder('entryLike')
            ->select('IDENTITY(entryLike.logEntry)')
            ->where('entryLike.user = :user')
            ->andWhere('entryLike.logEntry IN (:ids)')
            ->setParameter('user', $user)
            ->setParameter('ids', $logEntryIds)
            ->getQuery()
            ->getSingleColumnResult();
    }
}
