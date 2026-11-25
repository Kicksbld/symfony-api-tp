<?php

namespace App\Entity;

use App\Repository\MovieListCommentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MovieListCommentRepository::class)]
#[ORM\Index(fields: ['createdAt'])]
class MovieListComment extends AbstractComment
{
    #[ORM\ManyToOne(inversedBy: 'comments')]
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

    public function getCommentedResourceAuthor(): ?User
    {
        return $this->movieList->getUser();
    }
}
