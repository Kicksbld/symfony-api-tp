<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Compound;

#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_PARAMETER)]
final class Username extends Compound
{
    protected function getConstraints(array $options): array
    {
        return [
            new Assert\Length(min: 3, max: 20),
            new Assert\Regex(
                pattern: '/^[a-z0-9_]+$/',
                message: 'The username can only contain lowercase letters, digits and underscores.',
            ),
        ];
    }
}
