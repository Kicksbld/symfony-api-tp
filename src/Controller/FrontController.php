<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Sert la coquille de l'application React sur toutes les pages hors API : le routage des pages est fait côté client,
 * donc recharger /movies/12 doit renvoyer la même page que /.
 */
final class FrontController extends AbstractController
{
    // Priorité basse pour passer après toutes les autres routes, y compris celles du profiler et de Vite en dev.
    #[Route('/{path}', name: 'app_front', requirements: ['path' => '(?!api(/|$)|_profiler|_wdt|build/).*'], defaults: ['path' => ''], methods: ['GET'], priority: -100)]
    public function shell(): Response
    {
        return $this->render('front.html.twig');
    }
}
