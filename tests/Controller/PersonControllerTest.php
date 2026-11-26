<?php

namespace App\Tests\Controller;

use App\Entity\Person;
use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\Response;

final class PersonControllerTest extends ApiTestCase
{
    private const int CHRISTOPHER_NOLAN = 525;

    private const int QUENTIN_TARANTINO = 138;

    private const int MICHAEL_CAINE = 3895;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
    }

    public function testListSearchesPeopleByName(): void
    {
        $data = $this->requestJson('GET', '/api/people?q=nolan');

        self::assertResponseIsSuccessful();
        self::assertSame(['Christopher Nolan', 'Jonathan Nolan'], array_column($data['items'], 'name'));
        self::assertSame(2, $data['total']);
        self::assertSame([
            'id' => $this->findId(Person::class, ['tmdbId' => self::CHRISTOPHER_NOLAN]),
            'name' => 'Christopher Nolan',
            'profileUrl' => 'https://image.tmdb.org/t/p/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
        ], $data['items'][0]);
    }

    public function testListIsPaginatedInAlphabeticalOrder(): void
    {
        $data = $this->requestJson('GET', '/api/people?limit=2');

        self::assertResponseIsSuccessful();
        self::assertSame(['Aaron Eckhart', 'Amanda Plummer'], array_column($data['items'], 'name'));
        self::assertGreaterThan(1, $data['lastPage']);
    }

    public function testShowGroupsTheCrewFilmographyByJobFromTheMostRecentMovie(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::CHRISTOPHER_NOLAN]));

        self::assertResponseIsSuccessful();
        self::assertSame('Christopher Nolan', $data['name']);
        self::assertSame([], $data['cast']);
        self::assertSame(['Director', 'Writer', 'Screenplay'], array_keys($data['crew']));
        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir'], array_column($data['crew']['Director'], 'title'));
        self::assertSame(['Inception'], array_column($data['crew']['Writer'], 'title'));
        self::assertSame(['id', 'title', 'originalTitle', 'releaseDate', 'averageRating', 'posterUrl', 'backdropUrl'], array_keys($data['crew']['Director'][0]));
    }

    public function testShowListsTheRolesPlayedInTheCast(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::QUENTIN_TARANTINO]));

        self::assertResponseIsSuccessful();
        self::assertCount(1, $data['cast']);
        self::assertSame('Jimmie Dimmick', $data['cast'][0]['character']);
        self::assertSame('Pulp Fiction', $data['cast'][0]['movie']['title']);
        self::assertSame(['Director', 'Writer'], array_keys($data['crew']));
    }

    public function testShowReturnsNotFoundForAnUnknownPerson(): void
    {
        $data = $this->requestJson('GET', '/api/people/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
        self::assertSame(Response::HTTP_NOT_FOUND, $data['status']);
    }

    public function testMoviesListsEveryMovieOfThePersonOnceFromTheMostRecent(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::CHRISTOPHER_NOLAN]).'/movies?limit=1');

        self::assertResponseIsSuccessful();
        self::assertSame(['Inception'], array_column($data['items'], 'title'));
        self::assertSame(2, $data['total']);
        self::assertSame(2, $data['lastPage']);
    }

    public function testMoviesCanBeFilteredByJob(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::CHRISTOPHER_NOLAN]).'/movies?job=Screenplay');

        self::assertResponseIsSuccessful();
        self::assertSame(['The Dark Knight : Le Chevalier noir'], array_column($data['items'], 'title'));
    }

    public function testMoviesCanBeFilteredOnTheRolesPlayed(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::MICHAEL_CAINE]).'/movies?job=Actor');

        self::assertSame(['Inception', 'The Dark Knight : Le Chevalier noir'], array_column($data['items'], 'title'));
    }

    public function testMoviesOfAJobThePersonNeverHeldAreEmpty(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::MICHAEL_CAINE]).'/movies?job=Director');

        self::assertResponseIsSuccessful();
        self::assertSame([], $data['items']);
        self::assertSame(0, $data['total']);
    }

    public function testMoviesRejectATooLongJob(): void
    {
        $data = $this->requestJson('GET', '/api/people/'.$this->findId(Person::class, ['tmdbId' => self::MICHAEL_CAINE]).'/movies?job='.str_repeat('a', 101));

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['job'], array_column($data['violations'], 'propertyPath'));
    }

    public function testMoviesOfAnUnknownPersonReturnNotFound(): void
    {
        $this->requestJson('GET', '/api/people/999999/movies');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testListRejectsAnInvalidPagination(): void
    {
        $data = $this->requestJson('GET', '/api/people?page=0&limit=101');

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['page', 'limit'], array_column($data['violations'], 'propertyPath'));
    }
}
