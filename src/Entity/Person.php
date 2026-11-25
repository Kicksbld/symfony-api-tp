<?php

namespace App\Entity;

use App\Enum\CreditType;
use App\Model\TmdbImage;
use App\Repository\PersonRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PersonRepository::class)]
class Person
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movie:read', 'person:list', 'person:read'])]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private ?int $tmdbId = null;

    #[ORM\Column(length: 255)]
    #[Groups(['movie:read', 'person:list', 'person:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $profilePath = null;

    /**
     * @var Collection<int, Credit>
     */
    #[ORM\OneToMany(targetEntity: Credit::class, mappedBy: 'person')]
    private Collection $credits;

    public function __construct()
    {
        $this->credits = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTmdbId(): ?int
    {
        return $this->tmdbId;
    }

    public function setTmdbId(int $tmdbId): static
    {
        $this->tmdbId = $tmdbId;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getProfilePath(): ?string
    {
        return $this->profilePath;
    }

    public function setProfilePath(?string $profilePath): static
    {
        $this->profilePath = $profilePath;

        return $this;
    }

    #[Groups(['movie:read', 'person:list', 'person:read'])]
    public function getProfileUrl(): ?string
    {
        return TmdbImage::url($this->profilePath, TmdbImage::PROFILE_SIZE);
    }

    /**
     * Rôles joués, dans l'ordre où les crédits ont été chargés (voir PersonRepository::findWithFilmography()).
     *
     * @return list<Credit>
     */
    #[Groups(['person:read'])]
    #[Context(normalizationContext: ['groups' => ['person:read', 'movie:list', 'movie:cast']])]
    public function getCast(): array
    {
        return $this->credits->filter(static fn (Credit $credit): bool => CreditType::Cast === $credit->getType())->getValues();
    }

    /**
     * Forme renvoyée : ['Director' => [...], 'Writer' => [...]].
     *
     * @return array<string, list<Movie>>
     */
    #[Groups(['person:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:list']])]
    public function getCrew(): array
    {
        $moviesByJob = [];
        foreach ($this->credits as $credit) {
            if (CreditType::Crew === $credit->getType()) {
                $moviesByJob[$credit->getJob()][] = $credit->getMovie();
            }
        }

        return $moviesByJob;
    }
}
