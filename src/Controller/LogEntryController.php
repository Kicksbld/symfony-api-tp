<?php

namespace App\Controller;

use App\Dto\CreateLogEntryDto;
use App\Dto\LogEntrySearchDto;
use App\Dto\PaginationDto;
use App\Dto\UpdateLogEntryDto;
use App\Entity\LogEntry;
use App\Entity\User;
use App\Model\Paginator;
use App\Repository\LogEntryRepository;
use App\Security\Voter\LogEntryVoter;
use App\Service\LogEntryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/log-entries', name: 'api_log_entries_')]
final class LogEntryController extends AbstractController
{
    private const array GROUPS = ['logEntry:read'];

    public function __construct(
        private readonly LogEntryService $logEntryService,
        private readonly LogEntryRepository $logEntryRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] LogEntrySearchDto $logEntrySearchDto = new LogEntrySearchDto(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] PaginationDto $paginationDto = new PaginationDto(),
    ): JsonResponse {
        $logEntries = new Paginator()->paginate($this->logEntryRepository->createSearchQueryBuilder($logEntrySearchDto), $paginationDto);

        return $this->json($logEntries, context: ['groups' => ['paginate', ...self::GROUPS]]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] CreateLogEntryDto $createLogEntryDto,
    ): JsonResponse {
        $logEntry = $this->logEntryService->create($user, $createLogEntryDto);

        return $this->json($logEntry, Response::HTTP_CREATED, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function show(LogEntry $logEntry): JsonResponse
    {
        return $this->json($logEntry, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => Requirement::DIGITS], methods: ['PATCH'])]
    #[IsGranted(LogEntryVoter::EDIT, subject: 'logEntry')]
    public function update(
        LogEntry $logEntry,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UpdateLogEntryDto $updateLogEntryDto,
        Request $request,
    ): JsonResponse {
        // Dans le DTO, un champ absent et un champ à null valent tous les deux null : seul le corps de la requête
        // permet de savoir si le membre veut effacer la date, la note ou la critique.
        $sentFields = array_keys($request->getPayload()->all());
        $logEntry = $this->logEntryService->update($logEntry, $updateLogEntryDto, $sentFields);

        return $this->json($logEntry, context: ['groups' => self::GROUPS]);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => Requirement::DIGITS], methods: ['DELETE'])]
    #[IsGranted(LogEntryVoter::DELETE, subject: 'logEntry')]
    public function delete(LogEntry $logEntry): Response
    {
        $this->logEntryService->delete($logEntry);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
