<?php

namespace App\Enum;

/**
 * Les valeurs reprennent les clés de TMDB : flatrate correspond à l'abonnement.
 */
enum WatchProviderType: string
{
    case Flatrate = 'flatrate';
    case Rent = 'rent';
    case Buy = 'buy';
}
