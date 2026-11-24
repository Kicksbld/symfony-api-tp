<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[AsEventListener(event: Events::AUTHENTICATION_SUCCESS)]
final readonly class AuthenticationSuccessListener
{
    public function __construct(
        private NormalizerInterface $normalizer,
        #[Autowire(param: 'lexik_jwt_authentication.token_ttl')]
        private int $tokenTtl,
    ) {
    }

    public function __invoke(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        $data['ttl'] = $this->tokenTtl;
        $data['user'] = $this->normalizer->normalize($event->getUser(), null, ['groups' => User::PRIVATE_PROFILE_GROUPS]);

        $event->setData($data);
    }
}
