<?php

namespace App\Dto;

use App\Validator\Username;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un champ à null n'a pas été envoyé et n'est donc pas modifié. Une bio vide efface la bio.
 */
final readonly class UpdateProfileDto
{
    public function __construct(
        #[Username]
        public ?string $username = null,

        #[Assert\Length(max: 500)]
        public ?string $bio = null,
    ) {
    }
}
