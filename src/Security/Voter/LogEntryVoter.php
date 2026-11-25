<?php

namespace App\Security\Voter;

use App\Entity\LogEntry;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, LogEntry>
 */
final class LogEntryVoter extends Voter
{
    public const string EDIT = 'LOG_ENTRY_EDIT';

    public const string DELETE = 'LOG_ENTRY_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::EDIT, self::DELETE], true) && $subject instanceof LogEntry;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        return $user instanceof User && $subject->getUser() === $user;
    }
}
