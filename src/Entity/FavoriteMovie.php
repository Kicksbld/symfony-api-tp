<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;

/**
 * Un des 4 films favoris affichés sur le profil d'un membre, à sa place dans l'ordre choisi.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(fields: ['user', 'movie'])]
#[ORM\UniqueConstraint(fields: ['user', 'position'])]
#[ORM\HasLifecycleCallbacks]
class FavoriteMovie
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'favoriteMovies')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Movie $movie = null;

    #[ORM\Column]
    private int $position;

    public function __construct(User $user, Movie $movie, int $position)
    {
        $this->user = $user;
        $this->movie = $movie;
        $this->position = $position;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMovie(): ?Movie
    {
        return $this->movie;
    }
}
