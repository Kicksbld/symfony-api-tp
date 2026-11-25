<?php

namespace App\Dto;

use App\Entity\MovieList;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateMovieListDto
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: MovieList::NAME_MAX_LENGTH)]
        public ?string $name = null,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: MovieList::DESCRIPTION_MAX_LENGTH)]
        public ?string $description = null,

        public bool $ranked = false,

        public bool $public = true,
    ) {
    }
}
