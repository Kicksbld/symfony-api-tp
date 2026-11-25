<?php

namespace App\Enum;

enum MovieSort: string
{
    case Popular = 'popular';
    case Trending = 'trending';
    case Rating = 'rating';
    case ReleaseDate = 'releaseDate';
    case Title = 'title';
}
