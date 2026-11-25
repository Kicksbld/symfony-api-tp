<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class UserSearchDto
{
    public function __construct(
        // Un username fait 20 caractères au plus, une recherche plus longue ne peut rien trouver.
        #[Assert\Length(max: 20)]
        public ?string $q = null,
    ) {
    }
}
