<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\Criteria;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['email'], message: 'This email is already used.')]
#[UniqueEntity(fields: ['username'], message: 'This username is already taken.')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use TimestampableTrait;

    // Profil complet, réservé au membre lui-même : l'email ne doit pas apparaître sur les profils publics.
    public const array PRIVATE_PROFILE_GROUPS = ['user:read', 'user:private'];

    public const int FAVORITE_MOVIES_MAX = 4;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:list', 'user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:private'])]
    private ?string $email = null;

    #[ORM\Column(length: 20, unique: true)]
    #[Groups(['user:list', 'user:read'])]
    private ?string $username = null;

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $bio = null;

    /**
     * @var Collection<int, FavoriteMovie>
     */
    #[ORM\OneToMany(targetEntity: FavoriteMovie::class, mappedBy: 'user', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $favoriteMovies;

    /**
     * EXTRA_LAZY : compter les films vus fait un COUNT sans charger toutes les relations du membre.
     *
     * @var Collection<int, MovieRelationship>
     */
    #[ORM\OneToMany(targetEntity: MovieRelationship::class, mappedBy: 'user', fetch: 'EXTRA_LAZY')]
    private Collection $movieRelationships;

    /**
     * Membres que ce membre suit. EXTRA_LAZY pour compter les abonnements et tester un abonnement sans charger
     * toute la collection.
     *
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: self::class, inversedBy: 'followers', fetch: 'EXTRA_LAZY')]
    #[ORM\JoinTable(name: 'user_follow')]
    #[ORM\JoinColumn(name: 'follower_id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'followed_id', onDelete: 'CASCADE')]
    private Collection $following;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: self::class, mappedBy: 'following', fetch: 'EXTRA_LAZY')]
    private Collection $followers;

    public function __construct()
    {
        $this->favoriteMovies = new ArrayCollection();
        $this->movieRelationships = new ArrayCollection();
        $this->following = new ArrayCollection();
        $this->followers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    // Un seul rôle dans l'application, inutile de le stocker en base.
    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

        return $this;
    }

    /**
     * @return list<Movie>
     */
    #[Groups(['user:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:list']])]
    public function getFavorites(): array
    {
        return $this->favoriteMovies->map(static fn (FavoriteMovie $favoriteMovie): ?Movie => $favoriteMovie->getMovie())->getValues();
    }

    public function clearFavorites(): static
    {
        $this->favoriteMovies->clear();

        return $this;
    }

    public function addFavorite(Movie $movie): static
    {
        $this->favoriteMovies->add(new FavoriteMovie($this, $movie, $this->favoriteMovies->count() + 1));

        return $this;
    }

    #[Groups(['user:read'])]
    public function getWatchedCount(): int
    {
        return $this->movieRelationships->matching(Criteria::create()->andWhere(Criteria::expr()->eq('watched', true)))->count();
    }

    public function isFollowing(User $user): bool
    {
        return $this->following->contains($user);
    }

    public function follow(User $user): static
    {
        $this->following->add($user);

        return $this;
    }

    public function unfollow(User $user): static
    {
        $this->following->removeElement($user);

        return $this;
    }

    #[Groups(['user:read'])]
    public function getFollowersCount(): int
    {
        return $this->followers->count();
    }

    #[Groups(['user:read'])]
    public function getFollowingCount(): int
    {
        return $this->following->count();
    }
}
