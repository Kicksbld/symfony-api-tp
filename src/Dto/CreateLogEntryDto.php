<?php

namespace App\Dto;

use App\Entity\LogEntry;
use App\Entity\Movie;
use App\Validator\EntityExists;
use App\Validator\StarRating;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateLogEntryDto
{
    public function __construct(
        #[Assert\NotNull]
        #[Assert\Positive]
        #[EntityExists(Movie::class)]
        public ?int $movie = null,

        #[Assert\LessThanOrEqual('today')]
        public ?\DateTimeImmutable $watchedOn = null,

        #[StarRating]
        public ?float $rating = null,

        public bool $liked = false,

        public bool $rewatch = false,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: LogEntry::REVIEW_MAX_LENGTH)]
        public ?string $review = null,

        public bool $containsSpoilers = false,
    ) {
    }
}
