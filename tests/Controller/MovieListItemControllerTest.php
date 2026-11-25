<?php

namespace App\Tests\Controller;

use App\Entity\Movie;
use App\Entity\User;
use App\Tests\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Symfony\Component\HttpFoundation\Response;

final class MovieListItemControllerTest extends ApiTestCase
{
    private int $inceptionId;

    private int $darkKnightId;

    private int $pulpFictionId;

    private User $author;

    private int $movieListId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importMovieCatalog();
        $this->inceptionId = $this->findId(Movie::class, ['tmdbId' => 27205]);
        $this->darkKnightId = $this->findId(Movie::class, ['tmdbId' => 155]);
        $this->pulpFictionId = $this->findId(Movie::class, ['tmdbId' => 680]);

        $this->author = UserFactory::createOne();
        $this->loginAs($this->author);
        $this->movieListId = $this->requestJson('POST', '/api/lists', ['name' => 'Mon top', 'ranked' => true])['id'];
    }

    public function testAuthorCanAddAMovieWithANote(): void
    {
        $data = $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId, 'note' => 'Le meilleur.']);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertIsInt($data['id']);
        self::assertSame($this->inceptionId, $data['movie']['id']);
        self::assertSame('Inception', $data['movie']['title']);
        self::assertSame(1, $data['position']);
        self::assertSame('Le meilleur.', $data['note']);
    }

    public function testAddedMoviesGoToTheEndOfTheList(): void
    {
        $this->addMovie($this->inceptionId);
        $this->addMovie($this->darkKnightId);
        $this->addMovie($this->pulpFictionId);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $items = $this->requestJson('GET', $this->itemsUri());
        self::assertResponseIsSuccessful();
        self::assertSame([$this->inceptionId, $this->darkKnightId, $this->pulpFictionId], array_column(array_column($items['items'], 'movie'), 'id'));
        self::assertSame([1, 2, 3], array_column($items['items'], 'position'));
        self::assertSame(3, $items['total']);
        self::assertNull($items['items'][0]['note']);

        self::assertSame(3, $this->requestJson('GET', '/api/lists/'.$this->movieListId)['itemCount']);
    }

    public function testItemsArePaginated(): void
    {
        $this->addMovie($this->inceptionId);
        $this->addMovie($this->darkKnightId);
        $this->addMovie($this->pulpFictionId);

        $data = $this->requestJson('GET', $this->itemsUri().'?page=2&limit=2');

        self::assertSame([3], array_column($data['items'], 'position'));
        self::assertSame(2, $data['lastPage']);
    }

    public function testAMovieCanOnlyBeAddedOnceToAList(): void
    {
        $this->addMovie($this->inceptionId);

        $data = $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['movie'], array_column($data['violations'], 'propertyPath'));
    }

    public function testAddRejectsInvalidData(): void
    {
        $data = $this->requestJson('POST', $this->itemsUri(), ['movie' => 999999, 'note' => ' ']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['movie', 'note'], array_column($data['violations'], 'propertyPath'));
    }

    public function testMemberCannotAddAMovieToThePublicListOfSomeoneElse(): void
    {
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId]);

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testItemsOfAPrivateListAreNotFoundForOthers(): void
    {
        $this->requestJson('PATCH', '/api/lists/'.$this->movieListId, ['public' => false]);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('GET', $this->itemsUri());
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId]);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAddRequiresAuthentication(): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMovingAMoviePushesTheOthers(): void
    {
        $this->addMovie($this->inceptionId);
        $this->addMovie($this->darkKnightId);
        $pulpFiction = $this->addMovie($this->pulpFictionId);

        $data = $this->requestJson('PATCH', $this->itemsUri().'/'.$pulpFiction, ['position' => 1]);
        self::assertResponseIsSuccessful();
        self::assertSame(1, $data['position']);

        self::assertSame([$this->pulpFictionId, $this->inceptionId, $this->darkKnightId], $this->listedMovieIds());
    }

    public function testMovingAMovieDownPullsTheOthersUp(): void
    {
        $inception = $this->addMovie($this->inceptionId);
        $this->addMovie($this->darkKnightId);
        $this->addMovie($this->pulpFictionId);

        $this->requestJson('PATCH', $this->itemsUri().'/'.$inception, ['position' => 2]);

        self::assertSame([$this->darkKnightId, $this->inceptionId, $this->pulpFictionId], $this->listedMovieIds());
    }

    public function testMovingAMoviePastTheEndPutsItLast(): void
    {
        $inception = $this->addMovie($this->inceptionId);
        $this->addMovie($this->darkKnightId);

        $data = $this->requestJson('PATCH', $this->itemsUri().'/'.$inception, ['position' => 50]);

        self::assertSame(2, $data['position']);
        self::assertSame([$this->darkKnightId, $this->inceptionId], $this->listedMovieIds());
    }

    public function testAuthorCanChangeOrRemoveTheNote(): void
    {
        $this->loginAs($this->author);
        $itemId = $this->requestJson('POST', $this->itemsUri(), ['movie' => $this->inceptionId, 'note' => 'Bien.'])['id'];

        $changed = $this->requestJson('PATCH', $this->itemsUri().'/'.$itemId, ['note' => 'Le meilleur.']);
        self::assertSame('Le meilleur.', $changed['note']);
        self::assertSame(1, $changed['position']);

        $removed = $this->requestJson('PATCH', $this->itemsUri().'/'.$itemId, ['note' => null]);
        self::assertNull($removed['note']);
    }

    public function testUpdateRejectsInvalidData(): void
    {
        $itemId = $this->addMovie($this->inceptionId);

        $data = $this->requestJson('PATCH', $this->itemsUri().'/'.$itemId, ['position' => 0, 'note' => '']);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertSame(['position', 'note'], array_column($data['violations'], 'propertyPath'));
    }

    public function testRemovingAMovieKeepsThePositionsContinuous(): void
    {
        $this->addMovie($this->inceptionId);
        $darkKnight = $this->addMovie($this->darkKnightId);
        $this->addMovie($this->pulpFictionId);

        $this->client->jsonRequest('DELETE', $this->itemsUri().'/'.$darkKnight);
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $items = $this->requestJson('GET', $this->itemsUri());
        self::assertSame([$this->inceptionId, $this->pulpFictionId], array_column(array_column($items['items'], 'movie'), 'id'));
        self::assertSame([1, 2], array_column($items['items'], 'position'));
    }

    public function testDeletingAListRemovesItsItems(): void
    {
        $this->addMovie($this->inceptionId);

        $this->client->jsonRequest('DELETE', '/api/lists/'.$this->movieListId);
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $this->requestJson('GET', $this->itemsUri());
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAnItemOfAnotherListIsNotFound(): void
    {
        $itemId = $this->addMovie($this->inceptionId);
        $otherListId = $this->requestJson('POST', '/api/lists', ['name' => 'Autre liste'])['id'];

        $this->requestJson('PATCH', '/api/lists/'.$otherListId.'/items/'.$itemId, ['position' => 1]);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $this->requestJson('DELETE', '/api/lists/'.$otherListId.'/items/'.$itemId);
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testMemberCannotChangeTheItemsOfSomeoneElse(): void
    {
        $itemId = $this->addMovie($this->inceptionId);
        $this->loginAs(UserFactory::createOne());

        $this->requestJson('PATCH', $this->itemsUri().'/'.$itemId, ['position' => 1]);
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);

        $this->requestJson('DELETE', $this->itemsUri().'/'.$itemId);
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testChangingItemsRequiresAuthentication(): void
    {
        $itemId = $this->addMovie($this->inceptionId);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');

        $this->requestJson('PATCH', $this->itemsUri().'/'.$itemId, ['position' => 1]);
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);

        $this->requestJson('DELETE', $this->itemsUri().'/'.$itemId);
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    private function itemsUri(): string
    {
        return '/api/lists/'.$this->movieListId.'/items';
    }

    /**
     * Ajoute le film à la liste au nom de son auteur.
     */
    private function addMovie(int $movieId): int
    {
        $this->loginAs($this->author);
        $data = $this->requestJson('POST', $this->itemsUri(), ['movie' => $movieId]);
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        return $data['id'];
    }

    /**
     * @return list<int>
     */
    private function listedMovieIds(): array
    {
        $items = $this->requestJson('GET', $this->itemsUri());

        return array_column(array_column($items['items'], 'movie'), 'id');
    }
}
