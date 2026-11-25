<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Repository\MovieListRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MovieListRepository::class)]
#[ORM\Index(fields: ['createdAt'])]
#[ORM\HasLifecycleCallbacks]
class MovieList
{
    use TimestampableTrait;

    public const int NAME_MAX_LENGTH = 100;

    public const int DESCRIPTION_MAX_LENGTH = 1000;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movieList:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['movieList:read'])]
    #[Context(normalizationContext: ['groups' => ['user:list']])]
    private ?User $user = null;

    #[ORM\Column(length: self::NAME_MAX_LENGTH)]
    #[Groups(['movieList:read'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['movieList:read'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['movieList:read'])]
    private bool $ranked = false;

    #[ORM\Column]
    #[Groups(['movieList:read'])]
    private bool $public = true;

    /**
     * EXTRA_LAZY : compter les films d'une liste fait un COUNT sans charger tous ses éléments.
     *
     * @var Collection<int, MovieListItem>
     */
    #[ORM\OneToMany(targetEntity: MovieListItem::class, mappedBy: 'movieList', orphanRemoval: true, fetch: 'EXTRA_LAZY')]
    private Collection $items;

    public function __construct(User $user)
    {
        $this->user = $user;
        $this->items = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function isRanked(): bool
    {
        return $this->ranked;
    }

    public function setRanked(bool $ranked): static
    {
        $this->ranked = $ranked;

        return $this;
    }

    public function isPublic(): bool
    {
        return $this->public;
    }

    public function setPublic(bool $public): static
    {
        $this->public = $public;

        return $this;
    }

    #[Groups(['movieList:read'])]
    public function getItemCount(): int
    {
        return $this->items->count();
    }

    public function addItem(Movie $movie): MovieListItem
    {
        $item = new MovieListItem($this, $movie, $this->items->count() + 1);
        $this->items->add($item);

        return $item;
    }

    // Une position au-delà de la fin place le film en dernier.
    public function moveItem(MovieListItem $item, int $position): void
    {
        $otherItems = array_values(array_filter($this->getOrderedItems(), static fn (MovieListItem $other): bool => $other !== $item));
        array_splice($otherItems, min($position, \count($otherItems) + 1) - 1, 0, [$item]);

        $this->renumber($otherItems);
    }

    public function removeItem(MovieListItem $item): void
    {
        $this->items->removeElement($item);

        $this->renumber($this->getOrderedItems());
    }

    // Redéfini depuis TimestampableTrait pour l'exposer : c'est la date utilisée pour le tri des listes.
    #[Groups(['movieList:read'])]
    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return list<MovieListItem>
     */
    private function getOrderedItems(): array
    {
        $items = $this->items->toArray();
        usort($items, static fn (MovieListItem $a, MovieListItem $b): int => $a->getPosition() <=> $b->getPosition());

        return $items;
    }

    /**
     * Les positions restent continues de 1 au nombre de films, quel que soit le changement.
     *
     * @param list<MovieListItem> $orderedItems
     */
    private function renumber(array $orderedItems): void
    {
        foreach ($orderedItems as $index => $item) {
            $item->setPosition($index + 1);
        }
    }
}
