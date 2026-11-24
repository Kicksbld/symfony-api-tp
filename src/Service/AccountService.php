<?php

namespace App\Service;

use App\Dto\RegisterDto;
use App\Dto\UpdateProfileDto;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class AccountService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
    ) {
    }

    public function register(RegisterDto $registerDto): User
    {
        $user = (new User())
            ->setEmail($registerDto->email)
            ->setUsername($registerDto->username);

        $this->validate($user);

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

        $this->validate($user);
        $this->entityManager->flush();

        return $user;
    }

    /**
     * Le DTO valide le format, l'entité valide l'unicité de l'email et du username, qui demande la base.
     * L'exception est construite comme celle de MapRequestPayload pour renvoyer le même format d'erreur 422.
     */
    private function validate(User $user): void
    {
        $violations = $this->validator->validate($user);

        if (\count($violations) > 0) {
            throw new UnprocessableEntityHttpException((string) $violations, new ValidationFailedException($user, $violations));
        }
    }
}
