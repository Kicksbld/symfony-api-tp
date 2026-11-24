<?php

namespace App\Entity;

use App\Enum\WatchProviderType;
use App\Repository\MovieWatchProviderRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Disponibilité d'un film sur une plateforme, dans un pays et pour un type d'offre.
 */
#[ORM\Entity(repositoryClass: MovieWatchProviderRepository::class)]
class MovieWatchProvider
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'watchProviders')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Movie $movie = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?WatchProvider $watchProvider = null;

    // Pays de diffusion (FR, BE...), à ne pas confondre avec les pays de production du film.
    #[ORM\Column(length: 2)]
    private ?string $region = null;

    #[ORM\Column(enumType: WatchProviderType::class)]
    private ?WatchProviderType $type = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMovie(): ?Movie
    {
        return $this->movie;
    }

    public function setMovie(Movie $movie): static
    {
        $this->movie = $movie;

        return $this;
    }

    public function getWatchProvider(): ?WatchProvider
    {
        return $this->watchProvider;
    }

    public function setWatchProvider(WatchProvider $watchProvider): static
    {
        $this->watchProvider = $watchProvider;

        return $this;
    }

    public function getRegion(): ?string
    {
        return $this->region;
    }

    public function setRegion(string $region): static
    {
        $this->region = $region;

        return $this;
    }

    public function getType(): ?WatchProviderType
    {
        return $this->type;
    }

    public function setType(WatchProviderType $type): static
    {
        $this->type = $type;

        return $this;
    }
}
