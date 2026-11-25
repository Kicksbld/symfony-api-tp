<?php

namespace App\Dto;

use App\Entity\Movie;
use App\Entity\User;
use App\Validator\EntityExists;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ReplaceFavoritesDto
{
    /**
     * @param list<int>|null $movies identifiants des films, dans l'ordre d'affichage sur le profil
     */
    public function __construct(
        // Inutile de chercher les films en base si la liste est déjà trop longue ou contient un doublon.
        #[Assert\Sequentially([
            new Assert\NotNull(),
            new Assert\Count(max: User::FAVORITE_MOVIES_MAX),
            new Assert\Unique(),
            new Assert\All([
                new Assert\Type('integer'),
                new Assert\Positive(),
                new EntityExists(Movie::class),
            ]),
        ])]
        public ?array $movies = null,
    ) {
    }
}
