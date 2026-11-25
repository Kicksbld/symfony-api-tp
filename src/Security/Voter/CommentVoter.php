<?php

namespace App\Security\Voter;

use App\Entity\AbstractComment;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Seul l'auteur modifie son commentaire. L'auteur de la critique ou de la liste peut aussi le supprimer, pour modérer
 * ce qui est écrit chez lui.
 *
 * @extends Voter<string, AbstractComment>
 */
final class CommentVoter extends Voter
{
    public const string EDIT = 'COMMENT_EDIT';

    public const string DELETE = 'COMMENT_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::EDIT, self::DELETE], true) && $subject instanceof AbstractComment;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return $subject->getUser() === $user || (self::DELETE === $attribute && $subject->getCommentedResourceAuthor() === $user);
    }
}
