<?php

namespace App\Dto;

use App\Entity\AbstractComment;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Même corps pour écrire et pour modifier un commentaire : le contenu est son seul champ.
 */
final readonly class CommentDto
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: AbstractComment::CONTENT_MAX_LENGTH)]
        public ?string $content = null,
    ) {
    }
}
