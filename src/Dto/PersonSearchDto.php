<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PersonSearchDto
{
    public function __construct(
        #[Assert\Length(max: 255)]
        public ?string $q = null,
    ) {
    }
}
