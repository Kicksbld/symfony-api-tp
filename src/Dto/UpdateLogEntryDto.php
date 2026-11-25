<?php

namespace App\Dto;

use App\Entity\LogEntry;
use App\Validator\StarRating;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un booléen à null n'a pas été envoyé et n'est pas modifié. Pour watchedOn, rating et review, null efface la valeur :
 * seul le corps de la requête dit s'ils ont été envoyés (voir LogEntryController::update()).
 */
final readonly class UpdateLogEntryDto
{
    public function __construct(
        #[Assert\LessThanOrEqual('today')]
        public ?\DateTimeImmutable $watchedOn = null,

        #[StarRating]
        public ?float $rating = null,

        public ?bool $liked = null,

        public ?bool $rewatch = null,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: LogEntry::REVIEW_MAX_LENGTH)]
        public ?string $review = null,

        public ?bool $containsSpoilers = null,
    ) {
    }
}
