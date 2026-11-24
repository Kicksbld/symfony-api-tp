<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Sans en-tête Accept, Symfony renvoie ses pages d'erreur en HTML. On force le JSON sur toute l'API.
 * La priorité est plus haute que celle du routeur pour couvrir aussi les 404 de routes inconnues.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 256)]
final class ApiFormatListener
{
    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if (str_starts_with($request->getPathInfo(), '/api')) {
            $request->setRequestFormat('json');
        }
    }
}
