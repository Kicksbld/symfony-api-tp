<?php

namespace App\Model;

/**
 * Répartition des notes des membres sur un film : une colonne par demi-étoile, de 0.5 à 5.
 */
final readonly class RatingDistribution
{
    private const int MAX_HALF_STARS = 10;

    /**
     * @var list<array{rating: float, count: int}>
     */
    public array $histogram;

    public int $count;

    public ?float $average;

    /**
     * @param array<int, int> $countsByHalfStars nombre de notes par valeur stockée en base (1 à 10)
     */
    public function __construct(array $countsByHalfStars)
    {
        $histogram = [];
        $count = 0;
        $halfStarsSum = 0;

        foreach (range(1, self::MAX_HALF_STARS) as $halfStars) {
            $ratingCount = $countsByHalfStars[$halfStars] ?? 0;
            $histogram[] = ['rating' => $halfStars / 2, 'count' => $ratingCount];
            $count += $ratingCount;
            $halfStarsSum += $halfStars * $ratingCount;
        }

        $this->histogram = $histogram;
        $this->count = $count;
        $this->average = 0 === $count ? null : round($halfStarsSum / $count / 2, 2);
    }
}
