<?php

namespace App\Tests\Command;

use App\Tests\ApiTestCase;

/**
 * Les données de démo sont vérifiées à travers l'API, comme le correcteur les découvrira.
 */
final class SeedDemoCommandTest extends ApiTestCase
{
    public function testDemoMembersCanLogInWithTheKnownPassword(): void
    {
        $this->importMovieCatalog();

        $result = self::runCommand('app:seed-demo');

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('demo1234', $result->getDisplay());
        $data = $this->requestJson('POST', '/api/login_check', ['email' => 'jane@example.com', 'password' => 'demo1234']);
        self::assertResponseIsSuccessful();
        self::assertSame('jane_doe', $data['user']['username']);
    }

    public function testDemoMembersHaveActivityOnTheCatalogMovies(): void
    {
        $this->importMovieCatalog();
        self::runCommand('app:seed-demo');
        $this->logInAsJane();

        $profile = $this->requestJson('GET', '/api/me');
        self::assertCount(3, $profile['favorites']);
        self::assertSame(2, $profile['followingCount']);
        self::assertSame(3, $profile['watchedCount']);

        $feed = $this->requestJson('GET', '/api/feed');
        self::assertGreaterThan(0, $feed['total']);
        self::assertNotContains('jane_doe', array_column(array_column($feed['items'], 'user'), 'username'));

        $reviews = $this->requestJson('GET', '/api/log-entries?withReview=true&limit=100');
        self::assertGreaterThan(0, array_sum(array_column($reviews['items'], 'likeCount')));
        self::assertGreaterThan(0, array_sum(array_column($reviews['items'], 'commentCount')));

        $lists = $this->requestJson('GET', '/api/users/jane_doe/lists');
        self::assertSame(2, $lists['total']);
        self::assertContains(false, array_column($lists['items'], 'public'));

        self::assertGreaterThan(0, $this->requestJson('GET', '/api/users/camille/watchlist')['total']);
    }

    // Le premier élément de chaque ressource appartient à un autre membre que jane_doe : les fichiers .http s'en servent
    // pour montrer les erreurs 403.
    public function testTheFirstLogEntryListAndCommentsBelongToAnotherMember(): void
    {
        $this->importMovieCatalog();
        self::runCommand('app:seed-demo');

        self::assertSame('arthur', $this->requestJson('GET', '/api/log-entries/1')['user']['username']);
        self::assertSame('arthur', $this->requestJson('GET', '/api/lists/1')['user']['username']);
        self::assertSame('camille', $this->requestJson('GET', '/api/log-entries/1/comments')['items'][0]['user']['username']);
        self::assertSame('camille', $this->requestJson('GET', '/api/lists/1/comments')['items'][0]['user']['username']);
    }

    public function testRunningItAgainDoesNotDuplicateTheData(): void
    {
        $this->importMovieCatalog();
        self::runCommand('app:seed-demo');

        $result = self::runCommand('app:seed-demo');

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('already loaded', $result->getDisplay());
        self::assertSame(4, $this->requestJson('GET', '/api/users')['total']);
        self::assertSame(3, $this->requestJson('GET', '/api/lists')['total']);
    }

    public function testFailsWhenTheCatalogIsEmpty(): void
    {
        $result = self::runCommand('app:seed-demo');

        self::assertSame(1, $result->statusCode);
        self::assertStringContainsString('catalog is empty', $result->getDisplay());
        self::assertSame(0, $this->requestJson('GET', '/api/users')['total']);
    }

    private function logInAsJane(): void
    {
        $token = $this->requestJson('POST', '/api/login_check', ['email' => 'jane@example.com', 'password' => 'demo1234'])['token'];
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
    }
}
