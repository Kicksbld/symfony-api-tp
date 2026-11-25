<?php

namespace App\Dto;

use App\Entity\MovieWatchProvider;
use App\Enum\MovieSort;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class MovieSearchDto
{
    // Bornes des années acceptées, pour ne pas construire une date invalide dans les filtres.
    private const int FIRST_YEAR = 1870;

    private const int LAST_YEAR = 2100;

    public function __construct(
        #[Assert\Length(max: 255)]
        public ?string $q = null,

        #[Assert\Positive]
        public ?int $genre = null,

        // Première année de la décennie : 1990 pour les années 1990 à 1999.
        #[Assert\Range(min: self::FIRST_YEAR, max: self::LAST_YEAR)]
        #[Assert\DivisibleBy(10)]
        public ?int $decade = null,

        #[Assert\Range(min: self::FIRST_YEAR, max: self::LAST_YEAR)]
        public ?int $year = null,

        // Code ISO du pays de production.
        #[Assert\Country]
        public ?string $country = null,

        #[Assert\Positive]
        public ?int $company = null,

        #[Assert\Positive]
        public ?int $person = null,

        #[Assert\Positive]
        public ?int $provider = null,

        // Pays de diffusion, utilisé seulement avec le filtre provider.
        #[Assert\Choice(choices: MovieWatchProvider::REGIONS)]
        public string $region = MovieWatchProvider::DEFAULT_REGION,

        public MovieSort $sort = MovieSort::Popular,
    ) {
    }
}
