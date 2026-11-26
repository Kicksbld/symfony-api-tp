import { NotFoundMessage } from "@/components/NotFoundMessage";

export function NotFoundPage() {
    return <NotFoundMessage title="Page introuvable" message="Cette adresse ne mène à aucune page du site." action={{ to: "/", label: "Retour à l'accueil" }} />;
}
