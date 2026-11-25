<?php

namespace App\Dto;

use App\Validator\Username;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class MovieListSearchDto
{
    public function __construct(
        #[Assert\Length(max: 255)]
        public ?string $q = null,

        #[Username]
        public ?string $user = null,

        #[Assert\Positive]
        public ?int $movie = null,
    ) {
    }
}
