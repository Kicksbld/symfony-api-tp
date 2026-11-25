<?php

namespace App\Serializer;

use App\Entity\LogEntry;
use App\Entity\MovieList;
use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;

final readonly class SocialStateNormalizer implements NormalizerInterface
{
    public const string LIKED_IDS = 'social_state_liked_ids';
    public const string FOLLOWED_BY_ME = 'social_state_followed_by_me';

    public function __construct(
        #[Autowire(service: 'serializer.normalizer.object')]
        private ObjectNormalizer $objectNormalizer,
    ) {
    }

    public function getSupportedTypes(?string $format): array
    {
        return [LogEntry::class => false, MovieList::class => false, User::class => false];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return match (true) {
            $data instanceof LogEntry, $data instanceof MovieList => isset($context[self::LIKED_IDS]),
            $data instanceof User => isset($context[self::FOLLOWED_BY_ME]),
            default => false,
        };
    }

    public function normalize(mixed $data, ?string $format = null, array $context = []): array
    {
        $likedIds = $context[self::LIKED_IDS] ?? [];
        $followedByMe = $context[self::FOLLOWED_BY_ME] ?? false;
        // Chaque ressource reçoit son état sans le transmettre à ses objets imbriqués.
        unset($context[self::LIKED_IDS], $context[self::FOLLOWED_BY_ME]);

        $response = (array) $this->objectNormalizer->normalize($data, $format, $context);

        if ($data instanceof User) {
            $response['followedByMe'] = $followedByMe;
        } else {
            $response['likedByMe'] = isset($likedIds[$data->getId()]);
        }

        return $response;
    }
}
