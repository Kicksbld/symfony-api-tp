<?php

namespace App\Dto;

use App\Validator\Username;
use Symfony\Component\Validator\Constraints as Assert;

// Les valeurs par défaut font qu'un champ absent renvoie l'erreur NotBlank au lieu d'une erreur de type.
final readonly class RegisterDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        #[Assert\Length(max: 180)]
        public string $email = '',

        #[Assert\NotBlank]
        #[Username]
        public string $username = '',

        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 4096)]
        public string $password = '',
    ) {
    }
}
