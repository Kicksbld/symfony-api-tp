import { EyeOff, Heart, Loader2, Repeat } from "lucide-react";
import { useId, type FormEvent, type ReactNode } from "react";
import { Field } from "@/components/form/Field";
import { fieldDescription } from "@/components/form/field-description";
import { ToggleChip } from "@/components/form/ToggleChip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localDate, type DraftErrors, type LogEntryDraft } from "@/features/log-entries/draft";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRatingInput } from "@/features/movies/StarRatingInput";
import { releaseYear } from "@/features/movies/format";
import type { MovieSummary } from "@/lib/types";

// Même limite que LogEntry::REVIEW_MAX_LENGTH côté API.
const REVIEW_MAX_LENGTH = 10_000;

const QUICK_DATES = [
    { label: "Aujourd'hui", daysAgo: 0 },
    { label: "Hier", daysAgo: 1 },
];

type LogEntryFormProps = {
    draft: LogEntryDraft;
    errors: DraftErrors;
    submitting: boolean;
    submitLabel: string;
    onChange: (draft: LogEntryDraft) => void;
    onSubmit: () => void;
};

export function LogEntryForm({ draft, errors, submitting, submitLabel, onChange, onSubmit }: LogEntryFormProps) {
    const id = useId();
    const hasReview = draft.review.trim() !== "";

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (!submitting) {
            onSubmit();
        }
    }

    function update<TField extends keyof LogEntryDraft>(field: TField, value: LogEntryDraft[TField]): void {
        onChange({ ...draft, [field]: value });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={submitting}>
            {errors.others.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>{errors.others.join(" ")}</AlertDescription>
                </Alert>
            )}
            <Field id={`${id}-watchedOn`} label="Vu le" error={errors.fields.watchedOn}>
                <div className="flex flex-wrap gap-2">
                    <Input
                        id={`${id}-watchedOn`}
                        type="date"
                        required
                        max={localDate()}
                        value={draft.watchedOn}
                        className="w-auto flex-1 basis-40"
                        aria-invalid={errors.fields.watchedOn !== undefined}
                        aria-describedby={fieldDescription(`${id}-watchedOn`, { error: errors.fields.watchedOn })}
                        onChange={(event) => update("watchedOn", event.target.value)}
                    />
                    {QUICK_DATES.map(({ label, daysAgo }) => (
                        <ToggleChip key={label} pressed={draft.watchedOn === localDate(daysAgo)} onToggle={() => update("watchedOn", localDate(daysAgo))}>
                            {label}
                        </ToggleChip>
                    ))}
                </div>
            </Field>
            <Field id={`${id}-rating`} label="Note" optional error={errors.fields.rating}>
                <StarRatingInput
                    id={`${id}-rating`}
                    label="Note"
                    value={draft.rating === "" ? null : Number(draft.rating)}
                    invalid={errors.fields.rating !== undefined}
                    describedBy={fieldDescription(`${id}-rating`, { error: errors.fields.rating })}
                    onChange={(rating) => update("rating", rating === null ? "" : String(rating))}
                    size="lg"
                />
            </Field>
            <div role="group" aria-label="Ce visionnage" className="flex flex-wrap gap-2">
                <ToggleChip tone="heart" pressed={draft.liked} onToggle={() => update("liked", !draft.liked)} icon={<Heart aria-hidden="true" />}>
                    Coup de cœur
                </ToggleChip>
                <ToggleChip pressed={draft.rewatch} onToggle={() => update("rewatch", !draft.rewatch)} icon={<Repeat aria-hidden="true" />}>
                    Je l'avais déjà vu
                </ToggleChip>
            </div>
            <Field id={`${id}-review`} label="Critique" optional error={errors.fields.review} count={{ value: draft.review.length, max: REVIEW_MAX_LENGTH }}>
                <Textarea
                    id={`${id}-review`}
                    rows={5}
                    maxLength={REVIEW_MAX_LENGTH}
                    placeholder="Qu'avez-vous pensé du film ?"
                    className="max-h-72"
                    value={draft.review}
                    aria-invalid={errors.fields.review !== undefined}
                    aria-describedby={fieldDescription(`${id}-review`, { error: errors.fields.review })}
                    onChange={(event) => update("review", event.target.value)}
                />
            </Field>
            {/* Sans critique, il n'y a rien à cacher : l'option n'apparaît qu'une fois la critique commencée. */}
            {hasReview && (
                <ToggleChip pressed={draft.containsSpoilers} onToggle={() => update("containsSpoilers", !draft.containsSpoilers)} icon={<EyeOff aria-hidden="true" />}>
                    Ma critique révèle l'intrigue
                </ToggleChip>
            )}
            <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={submitting}>
                {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
                {submitting ? "Enregistrement…" : submitLabel}
            </Button>
        </form>
    );
}

type LogEntryDialogContentProps = {
    movie: MovieSummary;
    title: string;
    description: string;
    children: ReactNode;
};

// Le formulaire est long : la fenêtre défile sur un petit écran au lieu de sortir de l'écran.
export function LogEntryDialogContent({ movie, title, description, children }: LogEntryDialogContentProps) {
    return (
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader className="flex-row items-center gap-4 text-left">
                <MoviePoster movie={movie} alt="" className="w-14 shrink-0 rounded-md text-[0.5rem] ring-1 ring-white/10" />
                <div className="min-w-0 space-y-1">
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {movie.title}
                        {releaseYear(movie.releaseDate) !== undefined && ` · ${releaseYear(movie.releaseDate)}`}
                    </p>
                    <DialogDescription className="text-xs">{description}</DialogDescription>
                </div>
            </DialogHeader>
            {children}
        </DialogContent>
    );
}
