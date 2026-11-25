<?php

namespace App\Model;

/**
 * Répartition des notes des membres sur un film : une colonne par demi-étoile, de 0.5 à 5.
 */
final readonly class RatingDistribution
{
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

        foreach (range(1, Rating::MAX_HALF_STARS) as $halfStars) {
            $ratingCount = $countsByHalfStars[$halfStars] ?? 0;
            $histogram[] = ['rating' => Rating::toStars($halfStars), 'count' => $ratingCount];
            $count += $ratingCount;
            $halfStarsSum += $halfStars * $ratingCount;
        }

        $this->histogram = $histogram;
        $this->count = $count;
        $this->average = 0 === $count ? null : round(Rating::toStars($halfStarsSum / $count), 2);
    }
}
