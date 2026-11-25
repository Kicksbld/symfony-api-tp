<?php

namespace App\Repository;

use App\Dto\DiaryFilterDto;
use App\Dto\LogEntrySearchDto;
use App\Entity\LogEntry;
use App\Entity\Movie;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LogEntry>
 */
class LogEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LogEntry::class);
    }

    public function createSearchQueryBuilder(LogEntrySearchDto $logEntrySearchDto): QueryBuilder
    {
        $queryBuilder = $this->createWithUserAndMovieQueryBuilder();

        if (null !== $logEntrySearchDto->movie) {
            $queryBuilder
                ->andWhere('logEntry.movie = :movie')
                ->setParameter('movie', $logEntrySearchDto->movie);
        }

        if (null !== $logEntrySearchDto->user) {
            $queryBuilder
                ->andWhere('user.username = :username')
                ->setParameter('username', $logEntrySearchDto->user);
        }

        if ($logEntrySearchDto->withReview) {
            $queryBuilder->andWhere('logEntry.review IS NOT NULL');
        }

        return $this->orderByMostRecent($queryBuilder);
    }

    /**
     * Comme sur Letterboxd, le journal ne contient que les visionnages datés, du plus récent au plus ancien.
     */
    public function createDiaryQueryBuilder(User $user, DiaryFilterDto $diaryFilterDto): QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('logEntry')
            ->addSelect('movie')
            ->innerJoin('logEntry.movie', 'movie')
            ->andWhere('logEntry.user = :user')
            ->andWhere('logEntry.watchedOn IS NOT NULL')
            ->setParameter('user', $user);

        if (null !== $diaryFilterDto->year) {
            $start = new \DateTimeImmutable(\sprintf('%d-%d-01', $diaryFilterDto->year, $diaryFilterDto->month ?? 1));
            $end = $start->modify(null === $diaryFilterDto->month ? '+1 year' : '+1 month');

            $queryBuilder
                ->andWhere('logEntry.watchedOn >= :start')
                ->andWhere('logEntry.watchedOn < :end')
                ->setParameter('start', $start, Types::DATE_IMMUTABLE)
                ->setParameter('end', $end, Types::DATE_IMMUTABLE);
        }

        // À date de visionnage égale, la dernière entrée créée passe en premier.
        return $this->orderByMostRecent($queryBuilder->orderBy('logEntry.watchedOn', 'DESC'));
    }

    public function createFeedQueryBuilder(User $user): QueryBuilder
    {
        // La jointure sur les abonnés de l'auteur, filtrée sur le membre connecté, ne garde que les membres qu'il suit.
        $queryBuilder = $this->createWithUserAndMovieQueryBuilder()
            ->innerJoin('user.followers', 'follower')
            ->andWhere('follower = :follower')
            ->setParameter('follower', $user);

        return $this->orderByMostRecent($queryBuilder);
    }

    public function findLatestByUserAndMovie(User $user, Movie $movie): ?LogEntry
    {
        $queryBuilder = $this->createQueryBuilder('logEntry')
            ->andWhere('logEntry.user = :user')
            ->andWhere('logEntry.movie = :movie')
            ->setParameter('user', $user)
            ->setParameter('movie', $movie)
            ->setMaxResults(1);

        return $this->orderByMostRecent($queryBuilder)->getQuery()->getOneOrNullResult();
    }

    // Auteur et film sont joints pour être sérialisés sans une requête par entrée.
    private function createWithUserAndMovieQueryBuilder(): QueryBuilder
    {
        return $this->createQueryBuilder('logEntry')
            ->addSelect('user', 'movie')
            ->innerJoin('logEntry.user', 'user')
            ->innerJoin('logEntry.movie', 'movie');
    }

    // Complète le tri déjà posé, s'il y en a un. Plusieurs entrées peuvent être créées dans la même seconde :
    // l'identifiant départage.
    private function orderByMostRecent(QueryBuilder $queryBuilder): QueryBuilder
    {
        return $queryBuilder
            ->addOrderBy('logEntry.createdAt', 'DESC')
            ->addOrderBy('logEntry.id', 'DESC');
    }
}
