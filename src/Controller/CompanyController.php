<?php

namespace App\Controller;

use App\Entity\Company;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

// Les films d'un studio passent par le filtre company du catalogue : GET /api/movies?company={id}.
#[Route('/api/companies', name: 'api_companies_')]
final class CompanyController extends AbstractController
{
    #[Route('/{id}', name: 'show', requirements: ['id' => Requirement::DIGITS], methods: ['GET'])]
    public function show(Company $company): JsonResponse
    {
        return $this->json($company, context: ['groups' => ['company:read']]);
    }
}
