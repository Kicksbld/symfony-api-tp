<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class LogEntrySearchDto
{
    public function __construct(
        #[Assert\Positive]
        public ?int $movie = null,

        #[Assert\Positive]
        public ?int $user = null,

        public bool $withReview = false,
    ) {
    }
}
