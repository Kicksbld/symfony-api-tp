<?php

namespace App\Enum;

enum MovieSort: string
{
    case Popular = 'popular';
    case ReleaseDate = 'releaseDate';
    case Title = 'title';
}
