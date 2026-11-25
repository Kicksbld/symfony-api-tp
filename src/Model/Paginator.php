<?php

namespace App\Model;

use App\Dto\PaginationDto;
use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\Tools\Pagination\OffsetPaginator;
use Doctrine\ORM\Tools\Pagination\Window;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Classe de pagination du cours. Toutes les listes de l'API sortent au format { items, total, lastPage }.
 */
final class Paginator
{
    #[Groups(['paginate'])]
    public array $items = [];

    #[Groups(['paginate'])]
    public int $total = 0;

    #[Groups(['paginate'])]
    public int $lastPage = 1;

    public function paginate(QueryBuilder $query, PaginationDto $paginationDto): self
    {
        $page = new OffsetPaginator(fetchJoinCollection: true)
            ->paginate($query, Window::fromPageNumberAndSize($paginationDto->page, $paginationDto->limit));

        $this->items = $page->getItems();
        $this->total = $page->getTotalCount();
        $this->lastPage = $page->getPageCount();

        return $this;
    }
}
