<?php

namespace App\Entity;

use App\Repository\LogEntryLikeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LogEntryLikeRepository::class)]
#[ORM\UniqueConstraint(fields: ['user', 'logEntry'])]
class LogEntryLike extends AbstractLike
{
    #[ORM\ManyToOne(inversedBy: 'likes')]
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
}
