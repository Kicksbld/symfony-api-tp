<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Vérifie qu'un identifiant envoyé dans le corps de la requête correspond bien à une entité en base.
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_PARAMETER)]
final class EntityExists extends Constraint
{
    public string $message = 'No {{ entity }} found with the id {{ value }}.';

    /**
     * @param class-string $entityClass
     */
    public function __construct(
        public string $entityClass,
        ?array $groups = null,
        mixed $payload = null,
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
