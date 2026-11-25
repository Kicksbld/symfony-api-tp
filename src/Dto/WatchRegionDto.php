<?php

namespace App\Dto;

use App\Entity\MovieWatchProvider;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class WatchRegionDto
{
    public function __construct(
        #[Assert\Choice(choices: MovieWatchProvider::REGIONS)]
        public string $region = MovieWatchProvider::DEFAULT_REGION,
    ) {
    }
}
