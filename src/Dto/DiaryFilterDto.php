<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class DiaryFilterDto
{
    public function __construct(
        #[Assert\Range(min: 1900, max: 2100)]
        public ?int $year = null,

        #[Assert\Range(min: 1, max: 12)]
        #[Assert\Expression('value === null or this.year !== null', message: 'The month filter requires a year.')]
        public ?int $month = null,
    ) {
    }
}
