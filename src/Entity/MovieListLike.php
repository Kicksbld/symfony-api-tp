<?php

namespace App\Entity;

use App\Repository\MovieListLikeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MovieListLikeRepository::class)]
#[ORM\UniqueConstraint(fields: ['user', 'movieList'])]
class MovieListLike extends AbstractLike
{
    #[ORM\ManyToOne(inversedBy: 'likes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?MovieList $movieList = null;

    public function __construct(User $user, MovieList $movieList)
    {
        parent::__construct($user);
        $this->movieList = $movieList;
    }

    public function getMovieList(): ?MovieList
    {
        return $this->movieList;
    }
}
