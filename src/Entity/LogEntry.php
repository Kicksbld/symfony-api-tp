<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Model\Rating;
use App\Repository\LogEntryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

/**
 * Une entrée du journal, soit un visionnage. Une critique est une entrée avec du texte dans review.
 */
#[ORM\Entity(repositoryClass: LogEntryRepository::class)]
#[ORM\Index(fields: ['createdAt'])]
#[ORM\HasLifecycleCallbacks]
class LogEntry
{
    use TimestampableTrait;

    public const int REVIEW_MAX_LENGTH = 10000;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['logEntry:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['logEntry:read'])]
    #[Context(normalizationContext: ['groups' => ['user:list']])]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['logEntry:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:list']])]
    private ?Movie $movie = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['logEntry:read'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    private ?\DateTimeImmutable $watchedOn = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $rating = null;

    #[ORM\Column]
    #[Groups(['logEntry:read'])]
    private bool $liked = false;

    #[ORM\Column]
    #[Groups(['logEntry:read'])]
    private bool $rewatch = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['logEntry:read'])]
    private ?string $review = null;

    // Le texte est toujours renvoyé : c'est au client de le masquer.
    #[ORM\Column]
    #[Groups(['logEntry:read'])]
    private bool $containsSpoilers = false;

    /**
     * EXTRA_LAZY : compter les likes et les commentaires fait un COUNT sans tous les charger.
     *
     * @var Collection<int, LogEntryLike>
     */
    #[ORM\OneToMany(targetEntity: LogEntryLike::class, mappedBy: 'logEntry', fetch: 'EXTRA_LAZY')]
    private Collection $likes;

    /**
     * @var Collection<int, LogEntryComment>
     */
    #[ORM\OneToMany(targetEntity: LogEntryComment::class, mappedBy: 'logEntry', fetch: 'EXTRA_LAZY')]
    private Collection $comments;

    public function __construct(User $user, Movie $movie)
    {
        $this->user = $user;
        $this->movie = $movie;
        $this->likes = new ArrayCollection();
        $this->comments = new ArrayCollection();
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

    public function getWatchedOn(): ?\DateTimeImmutable
    {
        return $this->watchedOn;
    }

    public function setWatchedOn(?\DateTimeImmutable $watchedOn): static
    {
        $this->watchedOn = $watchedOn;

        return $this;
    }

    #[Groups(['logEntry:read'])]
    public function getRating(): ?float
    {
        return null === $this->rating ? null : Rating::toStars($this->rating);
    }

    public function setRating(?float $rating): static
    {
        $this->rating = null === $rating ? null : Rating::toHalfStars($rating);

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

    public function isRewatch(): bool
    {
        return $this->rewatch;
    }

    public function setRewatch(bool $rewatch): static
    {
        $this->rewatch = $rewatch;

        return $this;
    }

    public function getReview(): ?string
    {
        return $this->review;
    }

    public function setReview(?string $review): static
    {
        $this->review = $review;

        return $this;
    }

    public function isContainsSpoilers(): bool
    {
        return $this->containsSpoilers;
    }

    public function setContainsSpoilers(bool $containsSpoilers): static
    {
        $this->containsSpoilers = $containsSpoilers;

        return $this;
    }

    #[Groups(['logEntry:read'])]
    public function getLikeCount(): int
    {
        return $this->likes->count();
    }

    #[Groups(['logEntry:read'])]
    public function getCommentCount(): int
    {
        return $this->comments->count();
    }

    // Redéfini depuis TimestampableTrait pour l'exposer : c'est la date d'activité affichée dans le fil.
    #[Groups(['logEntry:read'])]
    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
