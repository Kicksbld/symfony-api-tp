<?php

namespace App\Dto;

use App\Entity\MovieListItem;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Une position à null n'a pas été envoyée et ne change pas. Pour note, null efface la valeur : seul le corps de la
 * requête dit si elle a été envoyée (voir MovieListItemController::update()).
 */
final readonly class UpdateMovieListItemDto
{
    public function __construct(
        #[Assert\Positive]
        public ?int $position = null,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: MovieListItem::NOTE_MAX_LENGTH)]
        public ?string $note = null,
    ) {
    }
}
