<?php

namespace App\Service;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Le DTO valide le format, l'entité valide ce qui demande la base (unicité). L'exception est construite comme celle
 * de MapRequestPayload pour renvoyer le même format d'erreur 422.
 */
final readonly class EntityValidator
{
    public function __construct(private ValidatorInterface $validator)
    {
    }

    public function validate(object $entity): void
    {
        $violations = $this->validator->validate($entity);

        if (\count($violations) > 0) {
            throw new UnprocessableEntityHttpException((string) $violations, new ValidationFailedException($entity, $violations));
        }
    }
}
