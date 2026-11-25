<?php

namespace App\Entity;

use App\Repository\LogEntryCommentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LogEntryCommentRepository::class)]
#[ORM\Index(fields: ['createdAt'])]
class LogEntryComment extends AbstractComment
{
    #[ORM\ManyToOne(inversedBy: 'comments')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?LogEntry $logEntry = null;

    public function __construct(User $user, LogEntry $logEntry)
    {
        parent::__construct($user);
        $this->logEntry = $logEntry;
    }

    public function getLogEntry(): ?LogEntry
    {
        return $this->logEntry;
    }

    public function getCommentedAuthor(): ?User
    {
        return $this->logEntry->getUser();
    }
}
