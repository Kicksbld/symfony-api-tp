<?php

namespace App\Entity;

use App\Enum\CreditType;
use App\Repository\CreditRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: CreditRepository::class)]
class Credit
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'credits')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['person:read'])]
    private ?Movie $movie = null;

    #[ORM\ManyToOne(inversedBy: 'credits')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['movie:read'])]
    private ?Person $person = null;

    #[ORM\Column(enumType: CreditType::class)]
    private ?CreditType $type = null;

    // Rôle joué, seulement pour la distribution.
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['movie:cast'])]
    private ?string $character = null;

    // Poste et département, seulement pour l'équipe.
    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['movie:crew'])]
    private ?string $job = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['movie:crew'])]
    private ?string $department = null;

    #[ORM\Column]
    private ?int $position = null;

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

    public function getPerson(): ?Person
    {
        return $this->person;
    }

    public function setPerson(Person $person): static
    {
        $this->person = $person;

        return $this;
    }

    public function getType(): ?CreditType
    {
        return $this->type;
    }

    public function setType(CreditType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getCharacter(): ?string
    {
        return $this->character;
    }

    public function setCharacter(?string $character): static
    {
        $this->character = $character;

        return $this;
    }

    public function getJob(): ?string
    {
        return $this->job;
    }

    public function setJob(?string $job): static
    {
        $this->job = $job;

        return $this;
    }

    public function getDepartment(): ?string
    {
        return $this->department;
    }

    public function setDepartment(?string $department): static
    {
        $this->department = $department;

        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }
}
