<?php

namespace App\Model;

/**
 * TMDB ne renvoie que le chemin des images, l'URL complète dépend de la taille voulue.
 */
final class TmdbImage
{
    private const string BASE_URL = 'https://image.tmdb.org/t/p/';

    public const string POSTER_SIZE = 'w500';

    public const string BACKDROP_SIZE = 'w1280';

    public const string PROFILE_SIZE = 'w185';

    public const string LOGO_SIZE = 'w92';

    public static function url(?string $path, string $size): ?string
    {
        return null === $path ? null : self::BASE_URL.$size.$path;
    }
}
