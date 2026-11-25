<?php

namespace App\Controller;

use App\Dto\UpdateMovieRelationshipDto;
use App\Entity\Movie;
use App\Entity\User;
use App\Service\MovieRelationshipService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/movies/{id}/relationship', name: 'api_movie_relationships_', requirements: ['id' => Requirement::DIGITS])]
#[IsGranted('IS_AUTHENTICATED')]
final class MovieRelationshipController extends AbstractController
{
    private const array GROUPS = ['movieRelationship:read'];

    public function __construct(private readonly MovieRelationshipService $movieRelationshipService)
    {
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(Movie $movie, #[CurrentUser] User $user): JsonResponse
    {
        return $this->json($this->movieRelationshipService->findOrNew($user, $movie), context: ['groups' => self::GROUPS]);
    }

    #[Route('', name: 'update', methods: ['PATCH'])]
    public function update(
        Movie $movie,
        #[CurrentUser] User $user,
        #[MapRequestPayload(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)] UpdateMovieRelationshipDto $updateMovieRelationshipDto,
        Request $request,
    ): JsonResponse {
        // Dans le DTO, un rating absent et un rating à null valent tous les deux null : seul le corps de la requête
        // permet de savoir si le membre veut retirer sa note.
        $ratingSent = $request->getPayload()->has('rating');
        $movieRelationship = $this->movieRelationshipService->update($user, $movie, $updateMovieRelationshipDto, $ratingSent);

        return $this->json($movieRelationship, context: ['groups' => self::GROUPS]);
    }
}
