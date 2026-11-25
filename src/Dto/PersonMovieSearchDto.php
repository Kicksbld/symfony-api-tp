<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PersonMovieSearchDto
{
    // TMDB ne donne un poste qu'à l'équipe, ce nom sert à demander les films où la personne joue.
    public const string ACTOR_JOB = 'Actor';

    public function __construct(
        // Poste TMDB (Director, Writer, Original Music Composer...) ou Actor pour les rôles joués.
        #[Assert\Length(max: 100)]
        public ?string $job = null,
    ) {
    }
}
