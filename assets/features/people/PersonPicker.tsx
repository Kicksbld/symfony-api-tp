import { useQuery } from "@tanstack/react-query";
import { Search, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import { MAX_PERSON_NAME_LENGTH, PEOPLE_PAGE_SIZE, peopleQuery } from "@/features/people/queries";
import type { PersonSummary } from "@/lib/types";

type PersonPickerProps = {
    triggerLabel: string;
    onSelect: (person: PersonSummary) => void;
};

export function PersonPicker({ triggerLabel, onSelect }: PersonPickerProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    function submitName(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        setName(typeof value === "string" ? value.trim() : "");
    }

    function select(person: PersonSummary): void {
        setOpen(false);
        onSelect(person);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserRound aria-hidden="true" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Filtrer par personne</DialogTitle>
                    <DialogDescription>Les films où elle joue ou fait partie de l'équipe.</DialogDescription>
                </DialogHeader>
                <form role="search" onSubmit={submitName} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="person-picker-name">Nom</Label>
                        <Input id="person-picker-name" name="q" type="search" defaultValue={name} maxLength={MAX_PERSON_NAME_LENGTH} />
                    </div>
                    <Button type="submit" variant="outline" size="icon" aria-label="Rechercher">
                        <Search aria-hidden="true" />
                    </Button>
                </form>
                {name !== "" && <PersonResults name={name} onSelect={select} />}
            </DialogContent>
        </Dialog>
    );
}

function PersonResults({ name, onSelect }: { name: string; onSelect: (person: PersonSummary) => void }) {
    const { data, error, isFetching, refetch } = useQuery(peopleQuery(name, 1));

    if (error !== null) {
        return <QueryError message="Impossible de charger les personnes." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (data === undefined) {
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Recherche en cours…
            </p>
        );
    }
    if (data.total === 0) {
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Aucune personne ne correspond à « {name} ».
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <ul className="space-y-1">
                {data.items.map((person) => (
                    <li key={person.id}>
                        <Button variant="ghost" className="h-auto w-full justify-start gap-3 py-1.5" onClick={() => onSelect(person)}>
                            <PersonPhoto person={person} alt="" className="w-8 rounded" loading="lazy" />
                            {person.name}
                        </Button>
                    </li>
                ))}
            </ul>
            {data.total > PEOPLE_PAGE_SIZE && (
                <p role="status" className="text-sm text-muted-foreground">
                    Seules les {PEOPLE_PAGE_SIZE} premières personnes sont affichées, précisez le nom.
                </p>
            )}
        </div>
    );
}
