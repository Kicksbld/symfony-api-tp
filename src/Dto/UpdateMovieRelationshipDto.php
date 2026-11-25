<?php

namespace App\Dto;

use App\Validator\StarRating;

/**
 * Un champ à null n'a pas été envoyé et n'est donc pas modifié, sauf rating où null retire la note
 * (voir MovieRelationshipController::update()).
 */
final readonly class UpdateMovieRelationshipDto
{
    public function __construct(
        public ?bool $watched = null,

        public ?bool $liked = null,

        #[StarRating]
        public ?float $rating = null,

        public ?bool $inWatchlist = null,
    ) {
    }
}
