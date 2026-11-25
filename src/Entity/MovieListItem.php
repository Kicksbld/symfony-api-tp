<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Repository\MovieListItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MovieListItemRepository::class)]
#[ORM\UniqueConstraint(fields: ['movieList', 'movie'])]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['movieList', 'movie'], message: 'This movie is already in the list.', errorPath: 'movie')]
class MovieListItem
{
    use TimestampableTrait;

    public const int NOTE_MAX_LENGTH = 1000;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movieListItem:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?MovieList $movieList = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['movieListItem:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:list']])]
    private ?Movie $movie = null;

    #[ORM\Column]
    #[Groups(['movieListItem:read'])]
    private int $position;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['movieListItem:read'])]
    private ?string $note = null;

    public function __construct(MovieList $movieList, Movie $movie, int $position)
    {
        $this->movieList = $movieList;
        $this->movie = $movie;
        $this->position = $position;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMovieList(): ?MovieList
    {
        return $this->movieList;
    }

    public function getMovie(): ?Movie
    {
        return $this->movie;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): static
    {
        $this->note = $note;

        return $this;
    }
}
