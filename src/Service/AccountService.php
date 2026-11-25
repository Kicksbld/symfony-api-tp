<?php

namespace App\Service;

use App\Dto\RegisterDto;
use App\Dto\UpdateProfileDto;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class AccountService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityValidator $entityValidator,
    ) {
    }

    public function register(RegisterDto $registerDto): User
    {
        $user = (new User())
            ->setEmail($registerDto->email)
            ->setUsername($registerDto->username);

        $this->entityValidator->validate($user);

        $user->setPassword($this->passwordHasher->hashPassword($user, $registerDto->password));
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function updateProfile(User $user, UpdateProfileDto $updateProfileDto): User
    {
        if (null !== $updateProfileDto->username) {
            $user->setUsername($updateProfileDto->username);
        }
        if (null !== $updateProfileDto->bio) {
            $user->setBio('' === $updateProfileDto->bio ? null : $updateProfileDto->bio);
        }

        $this->entityValidator->validate($user);
        $this->entityManager->flush();

        return $user;
    }
}
