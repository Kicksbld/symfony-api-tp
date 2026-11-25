<?php

namespace App\Dto;

use App\Validator\Username;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class LogEntrySearchDto
{
    public function __construct(
        #[Assert\Positive]
        public ?int $movie = null,

        #[Username]
        public ?string $user = null,

        public bool $withReview = false,
    ) {
    }
}
