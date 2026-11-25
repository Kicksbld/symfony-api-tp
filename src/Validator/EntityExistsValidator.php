<?php

namespace App\Validator;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

final class EntityExistsValidator extends ConstraintValidator
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof EntityExists) {
            throw new UnexpectedTypeException($constraint, EntityExists::class);
        }

        if (null === $value || null !== $this->entityManager->find($constraint->entityClass, $value)) {
            return;
        }

        $entityName = lcfirst(new \ReflectionClass($constraint->entityClass)->getShortName());

        $this->context->buildViolation($constraint->message)
            ->setParameter('{{ entity }}', $entityName)
            ->setParameter('{{ value }}', $this->formatValue($value))
            ->addViolation();
    }
}
