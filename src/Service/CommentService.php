<?php

namespace App\Service;

use App\Dto\CommentDto;
use App\Entity\AbstractComment;
use App\Entity\LogEntry;
use App\Entity\LogEntryComment;
use App\Entity\MovieList;
use App\Entity\MovieListComment;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final readonly class CommentService
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    public function commentLogEntry(User $user, LogEntry $logEntry, CommentDto $commentDto): LogEntryComment
    {
        return $this->save(new LogEntryComment($user, $logEntry), $commentDto);
    }

    public function commentMovieList(User $user, MovieList $movieList, CommentDto $commentDto): MovieListComment
    {
        return $this->save(new MovieListComment($user, $movieList), $commentDto);
    }

    public function update(AbstractComment $comment, CommentDto $commentDto): AbstractComment
    {
        return $this->save($comment, $commentDto);
    }

    public function delete(AbstractComment $comment): void
    {
        $this->entityManager->remove($comment);
        $this->entityManager->flush();
    }

    /**
     * @template T of AbstractComment
     *
     * @param T $comment
     *
     * @return T
     */
    private function save(AbstractComment $comment, CommentDto $commentDto): AbstractComment
    {
        $comment->setContent($commentDto->content);

        $this->entityManager->persist($comment);
        $this->entityManager->flush();

        return $comment;
    }
}
