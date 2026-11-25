<?php

namespace App\Service;

use App\Dto\CommentDto;
use App\Dto\CreateLogEntryDto;
use App\Dto\CreateMovieListDto;
use App\Dto\CreateMovieListItemDto;
use App\Dto\RegisterDto;
use App\Dto\ReplaceFavoritesDto;
use App\Dto\UpdateMovieRelationshipDto;
use App\Entity\Movie;
use App\Entity\User;
use App\Repository\MovieRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Crée des membres et leur activité en passant par les mêmes services que l'API, pour que les états sur les films et
 * les moyennes soient cohérents. Les films sont désignés par leur rang dans le catalogue trié par popularité : une
 * donnée qui vise un film absent du catalogue est ignorée.
 *
 * L'ordre compte : la première entrée de journal, la première liste et leurs premiers commentaires n'appartiennent
 * pas à jane_doe, les fichiers .http s'en servent pour montrer les erreurs 403.
 */
final readonly class DemoDataSeeder
{
    public const string PASSWORD = 'demo1234';

    public const array USERS = [
        'jane_doe' => ['email' => 'jane@example.com', 'bio' => 'Je note tout ce que je regarde, surtout le dimanche soir.'],
        'arthur' => ['email' => 'arthur@example.com', 'bio' => 'Cinéphile du samedi, fan de science-fiction.'],
        'camille' => ['email' => 'camille@example.com', 'bio' => null],
        'leo' => ['email' => 'leo@example.com', 'bio' => 'Plutôt séries, mais je fais des efforts.'],
    ];

    // jane_doe ne suit pas leo : follows.http s'en sert pour suivre un membre.
    private const array FOLLOWS = [
        'jane_doe' => ['arthur', 'camille'],
        'arthur' => ['jane_doe', 'camille'],
        'camille' => ['jane_doe', 'arthur', 'leo'],
        'leo' => ['camille'],
    ];

    private const int MOVIE_COUNT = 15;

    private const array LOG_ENTRIES = [
        ['user' => 'arthur', 'movie' => 0, 'daysAgo' => 3, 'rating' => 4.5, 'liked' => true, 'review' => 'Revu au cinéma, la mise en scène est toujours aussi impressionnante.', 'likedBy' => ['jane_doe', 'camille'], 'comments' => [['camille', 'Pareil, je ne m\'en lasse pas.'], ['jane_doe', 'Il faut que je le revoie en salle.']]],
        ['user' => 'jane_doe', 'movie' => 0, 'daysAgo' => 10, 'rating' => 4, 'review' => 'Un film qui tient ses promesses du début à la fin.', 'likedBy' => ['arthur']],
        ['user' => 'camille', 'movie' => 1, 'daysAgo' => 1, 'rating' => 3.5, 'review' => 'La fin m\'a surprise, je ne pensais pas que le héros perdrait tout.', 'containsSpoilers' => true, 'comments' => [['arthur', 'Attention aux spoilers !']]],
        ['user' => 'jane_doe', 'movie' => 1, 'daysAgo' => 5, 'rating' => 5, 'liked' => true],
        ['user' => 'leo', 'movie' => 2, 'daysAgo' => 2, 'rating' => 2.5, 'review' => 'Pas mon genre, trop long à mon goût.', 'likedBy' => ['camille'], 'comments' => [['jane_doe', 'Je ne suis pas d\'accord, mais je comprends.']]],
        ['user' => 'jane_doe', 'movie' => 2, 'daysAgo' => 40, 'rating' => 3.5],
        ['user' => 'jane_doe', 'movie' => 2, 'daysAgo' => 4, 'rating' => 4.5, 'liked' => true, 'rewatch' => true, 'review' => 'Bien meilleur au second visionnage.', 'likedBy' => ['arthur', 'camille']],
        ['user' => 'arthur', 'movie' => 3, 'daysAgo' => 20, 'rating' => 4],
        ['user' => 'camille', 'movie' => 4, 'daysAgo' => 6, 'rating' => 5, 'liked' => true, 'review' => 'Mon film préféré de l\'année.', 'likedBy' => ['jane_doe']],
        ['user' => 'arthur', 'movie' => 5, 'rating' => 3],
        ['user' => 'jane_doe', 'movie' => 6, 'daysAgo' => 15],
        ['user' => 'leo', 'movie' => 7, 'daysAgo' => 8, 'rating' => 4, 'liked' => true],
        ['user' => 'camille', 'movie' => 8, 'daysAgo' => 30, 'rating' => 3],
        ['user' => 'arthur', 'movie' => 9, 'daysAgo' => 12, 'rating' => 2, 'review' => 'Trop de clichés, je suis resté sur ma faim.'],
    ];

    // États posés sans entrée de journal : watchlist, ou film vu et noté sans le journaliser.
    private const array MOVIE_STATES = [
        ['user' => 'jane_doe', 'movie' => 10, 'inWatchlist' => true],
        ['user' => 'jane_doe', 'movie' => 11, 'inWatchlist' => true],
        ['user' => 'jane_doe', 'movie' => 12, 'inWatchlist' => true],
        ['user' => 'arthur', 'movie' => 1, 'inWatchlist' => true],
        ['user' => 'arthur', 'movie' => 13, 'inWatchlist' => true],
        ['user' => 'camille', 'movie' => 0, 'inWatchlist' => true],
        ['user' => 'camille', 'movie' => 14, 'inWatchlist' => true],
        ['user' => 'leo', 'movie' => 5, 'inWatchlist' => true],
        ['user' => 'leo', 'movie' => 3, 'watched' => true, 'liked' => true, 'rating' => 4.5],
    ];

    private const array FAVORITES = [
        'jane_doe' => [0, 1, 2, 4],
        'arthur' => [0, 3, 9],
        'camille' => [4, 1, 8, 0],
        'leo' => [7, 2],
    ];

    // items : rang du film => note facultative, dans l'ordre de la liste.
    private const array LISTS = [
        ['user' => 'arthur', 'name' => 'Les incontournables', 'description' => 'Les films à voir au moins une fois.', 'items' => [0 => null, 3 => 'Un classique.', 5 => null, 9 => null], 'likedBy' => ['jane_doe', 'camille'], 'comments' => [['camille', 'Belle sélection.'], ['jane_doe', 'J\'ajouterais quelques films plus anciens.']]],
        ['user' => 'jane_doe', 'name' => 'Mon top de l\'année', 'ranked' => true, 'items' => [1 => 'Le plus marquant.', 2 => null, 0 => null, 6 => null], 'likedBy' => ['arthur'], 'comments' => [['arthur', 'Bon classement.']]],
        ['user' => 'jane_doe', 'name' => 'À revoir un jour', 'public' => false, 'items' => [6 => null, 0 => null]],
        ['user' => 'camille', 'name' => 'Films pour une soirée pluvieuse', 'items' => [4 => null, 8 => null, 1 => null], 'likedBy' => ['leo']],
    ];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private MovieRepository $movieRepository,
        private UserRepository $userRepository,
        private AccountService $accountService,
        private FollowService $followService,
        private LogEntryService $logEntryService,
        private MovieRelationshipService $movieRelationshipService,
        private MovieListService $movieListService,
        private LikeService $likeService,
        private CommentService $commentService,
    ) {
    }

    // Un des membres de démo existe déjà : les données ont été chargées, ou un compte du même nom a été créé.
    public function isSeeded(): bool
    {
        return $this->userRepository->count(['username' => array_keys(self::USERS)]) > 0
            || $this->userRepository->count(['email' => array_column(self::USERS, 'email')]) > 0;
    }

    public function seed(): void
    {
        $movies = $this->movieRepository->findBy([], ['popularity' => 'DESC', 'id' => 'ASC'], self::MOVIE_COUNT);

        $this->entityManager->wrapInTransaction(function () use ($movies): void {
            $users = $this->createUsers();
            $this->createFollows($users);
            $this->createLogEntries($users, $movies);
            $this->createMovieStates($users, $movies);
            $this->createFavorites($users, $movies);
            $this->createLists($users, $movies);
        });
    }

    /**
     * @return array<string, User>
     */
    private function createUsers(): array
    {
        $users = [];
        foreach (self::USERS as $username => $profile) {
            $users[$username] = $this->accountService->register(new RegisterDto($profile['email'], $username, self::PASSWORD))->setBio($profile['bio']);
        }
        $this->entityManager->flush();

        return $users;
    }

    /**
     * @param array<string, User> $users
     */
    private function createFollows(array $users): void
    {
        foreach (self::FOLLOWS as $follower => $followedUsernames) {
            foreach ($followedUsernames as $followed) {
                $this->followService->follow($users[$follower], $users[$followed]);
            }
        }
    }

    /**
     * @param array<string, User> $users
     * @param list<Movie>         $movies
     */
    private function createLogEntries(array $users, array $movies): void
    {
        foreach (self::LOG_ENTRIES as $data) {
            if (!isset($movies[$data['movie']])) {
                continue;
            }

            $logEntry = $this->logEntryService->create($users[$data['user']], new CreateLogEntryDto(
                movie: $movies[$data['movie']]->getId(),
                watchedOn: isset($data['daysAgo']) ? new \DateTimeImmutable(\sprintf('today -%d days', $data['daysAgo'])) : null,
                rating: $data['rating'] ?? null,
                liked: $data['liked'] ?? false,
                rewatch: $data['rewatch'] ?? false,
                review: $data['review'] ?? null,
                containsSpoilers: $data['containsSpoilers'] ?? false,
            ));

            foreach ($data['likedBy'] ?? [] as $username) {
                $this->likeService->likeLogEntry($users[$username], $logEntry);
            }
            foreach ($data['comments'] ?? [] as [$username, $content]) {
                $this->commentService->commentLogEntry($users[$username], $logEntry, new CommentDto($content));
            }
        }
    }

    /**
     * @param array<string, User> $users
     * @param list<Movie>         $movies
     */
    private function createMovieStates(array $users, array $movies): void
    {
        foreach (self::MOVIE_STATES as $data) {
            if (!isset($movies[$data['movie']])) {
                continue;
            }

            $this->movieRelationshipService->update($users[$data['user']], $movies[$data['movie']], new UpdateMovieRelationshipDto(
                watched: $data['watched'] ?? null,
                liked: $data['liked'] ?? null,
                rating: $data['rating'] ?? null,
                inWatchlist: $data['inWatchlist'] ?? null,
            ), isset($data['rating']));
        }
    }

    /**
     * @param array<string, User> $users
     * @param list<Movie>         $movies
     */
    private function createFavorites(array $users, array $movies): void
    {
        foreach (self::FAVORITES as $username => $movieRanks) {
            $this->accountService->replaceFavorites($users[$username], new ReplaceFavoritesDto($this->findMovieIds($movies, $movieRanks)));
        }
        $this->entityManager->flush();
    }

    /**
     * @param array<string, User> $users
     * @param list<Movie>         $movies
     */
    private function createLists(array $users, array $movies): void
    {
        foreach (self::LISTS as $data) {
            $movieList = $this->movieListService->create($users[$data['user']], new CreateMovieListDto(
                name: $data['name'],
                description: $data['description'] ?? null,
                ranked: $data['ranked'] ?? false,
                public: $data['public'] ?? true,
            ));

            foreach ($data['items'] as $movieRank => $note) {
                if (isset($movies[$movieRank])) {
                    $this->movieListService->addItem($movieList, new CreateMovieListItemDto($movies[$movieRank]->getId(), $note));
                }
            }
            foreach ($data['likedBy'] ?? [] as $username) {
                $this->likeService->likeMovieList($users[$username], $movieList);
            }
            foreach ($data['comments'] ?? [] as [$username, $content]) {
                $this->commentService->commentMovieList($users[$username], $movieList, new CommentDto($content));
            }
        }
    }

    /**
     * @param list<Movie> $movies
     * @param list<int>   $movieRanks
     *
     * @return list<int>
     */
    private function findMovieIds(array $movies, array $movieRanks): array
    {
        $movieIds = [];
        foreach ($movieRanks as $movieRank) {
            if (isset($movies[$movieRank])) {
                $movieIds[] = $movies[$movieRank]->getId();
            }
        }

        return $movieIds;
    }
}
