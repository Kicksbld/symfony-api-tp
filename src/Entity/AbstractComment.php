<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Partie commune des commentaires sur une critique et sur une liste, chacun a sa propre table.
 */
#[ORM\MappedSuperclass]
#[ORM\HasLifecycleCallbacks]
abstract class AbstractComment
{
    use TimestampableTrait;

    public const int CONTENT_MAX_LENGTH = 1000;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['comment:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['comment:read'])]
    #[Context(normalizationContext: ['groups' => ['user:list']])]
    private ?User $user = null;

    #[ORM\Column(length: self::CONTENT_MAX_LENGTH)]
    #[Groups(['comment:read'])]
    private ?string $content = null;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Auteur de la critique ou de la liste commentée : il peut supprimer les commentaires faits chez lui.
     */
    abstract public function getCommentedAuthor(): ?User;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    // Redéfinis depuis TimestampableTrait pour les exposer : updatedAt montre qu'un commentaire a été modifié.
    #[Groups(['comment:read'])]
    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[Groups(['comment:read'])]
    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
