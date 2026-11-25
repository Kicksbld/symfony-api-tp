<?php

namespace App\Repository;

use App\Dto\UserSearchDto;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(\sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->flush();
    }

    public function createSearchQueryBuilder(UserSearchDto $userSearchDto): QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('user')->orderBy('user.username', 'ASC');

        if (null !== $userSearchDto->q) {
            $queryBuilder
                ->andWhere('user.username LIKE :q')
                ->setParameter('q', '%'.$userSearchDto->q.'%');
        }

        return $queryBuilder;
    }
}
