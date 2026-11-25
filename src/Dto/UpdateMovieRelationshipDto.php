<?php

namespace App\Dto;

use App\Model\Rating;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un champ à null n'a pas été envoyé et n'est donc pas modifié, sauf rating où null retire la note
 * (voir MovieRelationshipController::update()).
 */
final readonly class UpdateMovieRelationshipDto
{
    public function __construct(
        public ?bool $watched = null,

        public ?bool $liked = null,

        #[Assert\Range(min: Rating::MIN_STARS, max: Rating::MAX_STARS)]
        #[Assert\DivisibleBy(Rating::STEP)]
        public ?float $rating = null,

        public ?bool $inWatchlist = null,
    ) {
    }
}
