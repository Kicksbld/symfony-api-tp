<?php

namespace App\Repository;

use App\Entity\LogEntry;
use App\Entity\LogEntryComment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LogEntryComment>
 */
class LogEntryCommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LogEntryComment::class);
    }

    // Comme une conversation, du plus ancien au plus récent. L'auteur est joint pour être sérialisé sans une requête
    // par commentaire, et l'identifiant départage les commentaires postés dans la même seconde.
    public function createByLogEntryQueryBuilder(LogEntry $logEntry): QueryBuilder
    {
        return $this->createQueryBuilder('comment')
            ->addSelect('user')
            ->innerJoin('comment.user', 'user')
            ->andWhere('comment.logEntry = :logEntry')
            ->setParameter('logEntry', $logEntry)
            ->orderBy('comment.createdAt', 'ASC')
            ->addOrderBy('comment.id', 'ASC');
    }
}
