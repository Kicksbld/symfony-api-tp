<?php

namespace App\Security\Voter;

use App\Entity\MovieList;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, MovieList>
 */
final class MovieListVoter extends Voter
{
    public const string VIEW = 'MOVIE_LIST_VIEW';

    public const string EDIT = 'MOVIE_LIST_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::VIEW, self::EDIT], true) && $subject instanceof MovieList;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        if (self::VIEW === $attribute && $subject->isPublic()) {
            return true;
        }

        $user = $token->getUser();

        return $user instanceof User && $subject->getUser() === $user;
    }
}
