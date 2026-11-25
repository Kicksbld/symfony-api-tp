<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Model\Rating;
use App\Repository\MovieRelationshipRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
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

    #[ORM\ManyToOne(inversedBy: 'movieRelationships')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['movieRelationship:list'])]
    #[Context(normalizationContext: ['groups' => ['movie:list']])]
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

    // Journaliser un film le marque comme vu et le sort de la watchlist.
    public function recordLogEntry(LogEntry $logEntry): static
    {
        $this->watched = true;
        $this->inWatchlist = false;

        return $this->followLogEntry($logEntry);
    }

    // La note et le coup de coeur suivent la dernière entrée. Une entrée sans note ni coup de coeur ne retire pas ceux déjà donnés.
    public function followLogEntry(LogEntry $logEntry): static
    {
        if (null !== $logEntry->getRating()) {
            $this->setRating($logEntry->getRating());
        }
        if ($logEntry->isLiked()) {
            $this->liked = true;
        }

        return $this;
    }
}
