<?php

namespace App\Tests\Command;

final class TmdbExportCommandTest extends TmdbCommandTestCase
{
    public function testExportsTheCatalogInTheFormatReadByTheImport(): void
    {
        self::runCommand('app:tmdb:import', ['--pages' => 1]);
        $output = tempnam(sys_get_temp_dir(), 'movies');

        $result = self::runCommand('app:tmdb:export', ['--output' => $output]);

        $this->assertCommandIsSuccessful($result);
        self::assertStringContainsString('3 movies exported', $result->getDisplay());
        self::assertFileEquals(self::CATALOG_FILE, $output);
        unlink($output);
    }
}
