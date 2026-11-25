<?php

namespace App\Entity;

use App\Model\TmdbImage;
use App\Repository\CompanyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: CompanyRepository::class)]
class Company
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movie:read', 'company:read'])]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private ?int $tmdbId = null;

    #[ORM\Column(length: 255)]
    #[Groups(['movie:read', 'company:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $logoPath = null;

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

    public function getLogoPath(): ?string
    {
        return $this->logoPath;
    }

    public function setLogoPath(?string $logoPath): static
    {
        $this->logoPath = $logoPath;

        return $this;
    }

    #[Groups(['movie:read', 'company:read'])]
    public function getLogoUrl(): ?string
    {
        return TmdbImage::url($this->logoPath, TmdbImage::LOGO_SIZE);
    }
}
