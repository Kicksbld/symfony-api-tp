<?php

namespace App\Model;

/**
 * L'API parle en étoiles (0.5 à 5 par demi-étoile), la base stocke des demi-étoiles (1 à 10) pour garder un entier.
 */
final class Rating
{
    public const float MIN_STARS = 0.5;

    public const float MAX_STARS = 5;

    public const float STEP = 0.5;

    public const int MAX_HALF_STARS = 10;

    public static function toHalfStars(float $stars): int
    {
        return (int) round($stars * 2);
    }

    public static function toStars(int|float $halfStars): float
    {
        return $halfStars / 2;
    }
}
