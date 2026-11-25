<?php

namespace App\Dto;

use App\Entity\MovieList;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un champ à null n'a pas été envoyé et n'est pas modifié, sauf description où null efface la valeur :
 * seul le corps de la requête dit si elle a été envoyée (voir MovieListController::update()).
 */
final readonly class UpdateMovieListDto
{
    public function __construct(
        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: MovieList::NAME_MAX_LENGTH)]
        public ?string $name = null,

        #[Assert\NotBlank(allowNull: true, normalizer: 'trim')]
        #[Assert\Length(max: MovieList::DESCRIPTION_MAX_LENGTH)]
        public ?string $description = null,

        public ?bool $ranked = null,

        public ?bool $public = null,
    ) {
    }
}
