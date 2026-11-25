<?php

namespace App\Validator;

use App\Model\Rating;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Compound;

/**
 * Note en étoiles telle que l'API la reçoit : de 0.5 à 5 par demi-étoile.
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_PARAMETER)]
final class StarRating extends Compound
{
    protected function getConstraints(array $options): array
    {
        return [
            new Assert\Range(min: Rating::MIN_STARS, max: Rating::MAX_STARS),
            new Assert\DivisibleBy(Rating::STEP),
        ];
    }
}
