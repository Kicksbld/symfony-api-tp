<?php

namespace App\Dto;

use App\Entity\Movie;
use App\Entity\MovieListItem;
use App\Validator\EntityExists;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateMovieListItemDto
{
    public function __construct(
        #[Assert\NotNull]
        #[Assert\Positive]
        #[EntityExists(Movie::class)]
        public ?int $movie = null,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: MovieListItem::NOTE_MAX_LENGTH)]
        public ?string $note = null,
    ) {
    }
}
