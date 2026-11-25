<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Model\Rating;
use App\Repository\MovieRelationshipRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MovieRelationshipRepository::class)]
#[ORM\UniqueConstraint(fields: ['user', 'movie'])]
#[ORM\HasLifecycleCallbacks]
class MovieRelationship
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Movie $movie = null;

    #[ORM\Column]
    #[Groups(['movieRelationship:read'])]
    private bool $watched = false;

    #[ORM\Column]
    #[Groups(['movieRelationship:read'])]
    private bool $liked = false;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $rating = null;

    #[ORM\Column]
    #[Groups(['movieRelationship:read'])]
    private bool $inWatchlist = false;

    public function __construct(User $user, Movie $movie)
    {
        $this->user = $user;
        $this->movie = $movie;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function getMovie(): ?Movie
    {
        return $this->movie;
    }

    public function isWatched(): bool
    {
        return $this->watched;
    }

    public function setWatched(bool $watched): static
    {
        $this->watched = $watched;

        return $this;
    }

    public function isLiked(): bool
    {
        return $this->liked;
    }

    public function setLiked(bool $liked): static
    {
        $this->liked = $liked;

        return $this;
    }

    #[Groups(['movieRelationship:read'])]
    public function getRating(): ?float
    {
        return null === $this->rating ? null : Rating::toStars($this->rating);
    }

    public function setRating(?float $rating): static
    {
        $this->rating = null === $rating ? null : Rating::toHalfStars($rating);

        return $this;
    }

    public function isInWatchlist(): bool
    {
        return $this->inWatchlist;
    }

    public function setInWatchlist(bool $inWatchlist): static
    {
        $this->inWatchlist = $inWatchlist;

        return $this;
    }
}
