<?php

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use App\Enum\CreditType;
use App\Enum\WatchProviderType;
use App\Model\RatingDistribution;
use App\Model\TmdbImage;
use App\Repository\MovieRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

#[ORM\Entity(repositoryClass: MovieRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Movie
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movie:list', 'movie:read'])]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private ?int $tmdbId = null;

    // Titre français, TMDB renvoie le titre original quand il n'y a pas de traduction.
    #[ORM\Column(length: 255)]
    #[Groups(['movie:list', 'movie:read'])]
    private ?string $title = null;

    #[ORM\Column(length: 255)]
    #[Groups(['movie:list', 'movie:read'])]
    private ?string $originalTitle = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['movie:read'])]
    private ?string $overview = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['movie:list', 'movie:read'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    private ?\DateTimeImmutable $releaseDate = null;

    // Durée en minutes.
    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    #[Groups(['movie:read'])]
    private ?int $runtime = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $posterPath = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $backdropPath = null;

    #[ORM\Column]
    private float $popularity = 0;

    // Note moyenne TMDB sur 10, affichée à titre indicatif à côté de celle des membres.
    #[ORM\Column]
    #[Groups(['movie:read'])]
    private float $voteAverage = 0;

    #[ORM\Column]
    #[Groups(['movie:read'])]
    private int $voteCount = 0;

    // Moyenne des notes des membres sur 5, recalculée à chaque changement de note pour pouvoir trier dessus.
    #[ORM\Column(nullable: true)]
    #[Groups(['movie:list', 'movie:read'])]
    private ?float $averageRating = null;

    #[ORM\Column(options: ['default' => 0])]
    #[Groups(['movie:read'])]
    private int $ratingCount = 0;

    /**
     * @var Collection<int, Genre>
     */
    #[ORM\ManyToMany(targetEntity: Genre::class)]
    #[Groups(['movie:read'])]
    private Collection $genres;

    /**
     * @var Collection<int, Company>
     */
    #[ORM\ManyToMany(targetEntity: Company::class)]
    #[Groups(['movie:read'])]
    private Collection $companies;

    /**
     * Pays de production.
     *
     * @var Collection<int, Country>
     */
    #[ORM\ManyToMany(targetEntity: Country::class)]
    #[Groups(['movie:read'])]
    private Collection $countries;

    /**
     * @var Collection<int, Credit>
     */
    #[ORM\OneToMany(targetEntity: Credit::class, mappedBy: 'movie', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['type' => 'ASC', 'position' => 'ASC'])]
    private Collection $credits;

    /**
     * @var Collection<int, MovieWatchProvider>
     */
    #[ORM\OneToMany(targetEntity: MovieWatchProvider::class, mappedBy: 'movie', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $watchProviders;

    public function __construct()
    {
        $this->genres = new ArrayCollection();
        $this->companies = new ArrayCollection();
        $this->countries = new ArrayCollection();
        $this->credits = new ArrayCollection();
        $this->watchProviders = new ArrayCollection();
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

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getOriginalTitle(): ?string
    {
        return $this->originalTitle;
    }

    public function setOriginalTitle(string $originalTitle): static
    {
        $this->originalTitle = $originalTitle;

        return $this;
    }

    public function getOverview(): ?string
    {
        return $this->overview;
    }

    public function setOverview(?string $overview): static
    {
        $this->overview = $overview;

        return $this;
    }

    public function getReleaseDate(): ?\DateTimeImmutable
    {
        return $this->releaseDate;
    }

    public function setReleaseDate(?\DateTimeImmutable $releaseDate): static
    {
        $this->releaseDate = $releaseDate;

        return $this;
    }

    public function getRuntime(): ?int
    {
        return $this->runtime;
    }

    public function setRuntime(?int $runtime): static
    {
        $this->runtime = $runtime;

        return $this;
    }

    public function getPosterPath(): ?string
    {
        return $this->posterPath;
    }

    public function setPosterPath(?string $posterPath): static
    {
        $this->posterPath = $posterPath;

        return $this;
    }

    #[Groups(['movie:list', 'movie:read'])]
    public function getPosterUrl(): ?string
    {
        return TmdbImage::url($this->posterPath, TmdbImage::POSTER_SIZE);
    }

    public function getBackdropPath(): ?string
    {
        return $this->backdropPath;
    }

    public function setBackdropPath(?string $backdropPath): static
    {
        $this->backdropPath = $backdropPath;

        return $this;
    }

    #[Groups(['movie:list', 'movie:read'])]
    public function getBackdropUrl(): ?string
    {
        return TmdbImage::url($this->backdropPath, TmdbImage::BACKDROP_SIZE);
    }

    public function getPopularity(): float
    {
        return $this->popularity;
    }

    public function setPopularity(float $popularity): static
    {
        $this->popularity = $popularity;

        return $this;
    }

    public function getVoteAverage(): float
    {
        return $this->voteAverage;
    }

    public function setVoteAverage(float $voteAverage): static
    {
        $this->voteAverage = $voteAverage;

        return $this;
    }

    public function getVoteCount(): int
    {
        return $this->voteCount;
    }

    public function setVoteCount(int $voteCount): static
    {
        $this->voteCount = $voteCount;

        return $this;
    }

    public function getAverageRating(): ?float
    {
        return $this->averageRating;
    }

    public function getRatingCount(): int
    {
        return $this->ratingCount;
    }

    public function updateRatings(RatingDistribution $ratingDistribution): static
    {
        $this->averageRating = $ratingDistribution->average;
        $this->ratingCount = $ratingDistribution->count;

        return $this;
    }

    /**
     * @return Collection<int, Genre>
     */
    public function getGenres(): Collection
    {
        return $this->genres;
    }

    /**
     * @param list<Genre> $genres
     */
    public function replaceGenres(array $genres): static
    {
        $this->genres->clear();
        foreach ($genres as $genre) {
            $this->genres->add($genre);
        }

        return $this;
    }

    /**
     * @return Collection<int, Company>
     */
    public function getCompanies(): Collection
    {
        return $this->companies;
    }

    /**
     * @param list<Company> $companies
     */
    public function replaceCompanies(array $companies): static
    {
        $this->companies->clear();
        foreach ($companies as $company) {
            $this->companies->add($company);
        }

        return $this;
    }

    /**
     * @return Collection<int, Country>
     */
    public function getCountries(): Collection
    {
        return $this->countries;
    }

    /**
     * @param list<Country> $countries
     */
    public function replaceCountries(array $countries): static
    {
        $this->countries->clear();
        foreach ($countries as $country) {
            $this->countries->add($country);
        }

        return $this;
    }

    /**
     * @return Collection<int, Credit>
     */
    public function getCredits(): Collection
    {
        return $this->credits;
    }

    /**
     * Le groupe movie:cast ajoute le personnage, movie:crew le poste : chaque liste n'a que ses champs.
     *
     * @return list<Credit>
     */
    #[Groups(['movie:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:read', 'movie:cast']])]
    public function getCast(): array
    {
        return $this->credits->filter(static fn (Credit $credit): bool => CreditType::Cast === $credit->getType())->getValues();
    }

    /**
     * @return list<Credit>
     */
    #[Groups(['movie:read'])]
    #[Context(normalizationContext: ['groups' => ['movie:read', 'movie:crew']])]
    public function getCrew(): array
    {
        return $this->credits->filter(static fn (Credit $credit): bool => CreditType::Crew === $credit->getType())->getValues();
    }

    /**
     * Les anciens crédits sont supprimés grâce à orphanRemoval.
     *
     * @param list<Credit> $credits
     */
    public function replaceCredits(array $credits): static
    {
        $this->credits->clear();
        foreach ($credits as $credit) {
            $this->credits->add($credit->setMovie($this));
        }

        return $this;
    }

    /**
     * @return Collection<int, MovieWatchProvider>
     */
    public function getWatchProviders(): Collection
    {
        return $this->watchProviders;
    }

    /**
     * Plateformes d'un pays de diffusion, rangées par type d'offre dans l'ordre de TMDB.
     *
     * @return array<string, list<WatchProvider>>
     */
    public function getWatchProvidersByType(string $region): array
    {
        $watchProvidersByType = array_fill_keys(array_column(WatchProviderType::cases(), 'value'), []);

        foreach ($this->watchProviders as $movieWatchProvider) {
            if ($region === $movieWatchProvider->getRegion()) {
                $watchProvidersByType[$movieWatchProvider->getType()->value][] = $movieWatchProvider->getWatchProvider();
            }
        }

        return $watchProvidersByType;
    }

    /**
     * @param list<MovieWatchProvider> $watchProviders
     */
    public function replaceWatchProviders(array $watchProviders): static
    {
        $this->watchProviders->clear();
        foreach ($watchProviders as $watchProvider) {
            $this->watchProviders->add($watchProvider->setMovie($this));
        }

        return $this;
    }
}
