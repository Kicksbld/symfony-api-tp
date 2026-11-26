import { useId, type FormEvent, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localToday, type DraftErrors, type LogEntryDraft } from "@/features/log-entries/draft";
import { StarRatingInput } from "@/features/movies/StarRatingInput";

// Même limite que LogEntry::REVIEW_MAX_LENGTH côté API.
const REVIEW_MAX_LENGTH = 10_000;

type BooleanField = "liked" | "rewatch" | "containsSpoilers";

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

    function checkbox(field: BooleanField, label: string, disabled = false): ReactNode {
        return (
            <div className="flex items-center gap-3">
                <Checkbox
                    id={`${id}-${field}`}
                    checked={draft[field] && !disabled}
                    disabled={disabled}
                    onCheckedChange={(checked) => update(field, checked === true)}
                />
                <Label htmlFor={`${id}-${field}`}>{label}</Label>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={submitting}>
            {errors.others.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>{errors.others.join(" ")}</AlertDescription>
                </Alert>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${id}-watchedOn`} label="Date de visionnage" error={errors.fields.watchedOn}>
                    <Input
                        id={`${id}-watchedOn`}
                        type="date"
                        required
                        max={localToday()}
                        value={draft.watchedOn}
                        aria-invalid={errors.fields.watchedOn !== undefined}
                        aria-describedby={errors.fields.watchedOn && `${id}-watchedOn-error`}
                        onChange={(event) => update("watchedOn", event.target.value)}
                    />
                </Field>
                <Field id={`${id}-rating`} label="Note" error={errors.fields.rating}>
                    <StarRatingInput
                        id={`${id}-rating`}
                        label="Note"
                        value={draft.rating === "" ? null : Number(draft.rating)}
                        invalid={errors.fields.rating !== undefined}
                        describedBy={errors.fields.rating && `${id}-rating-error`}
                        onChange={(rating) => update("rating", rating === null ? "" : String(rating))}
                    />
                </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
                {checkbox("liked", "Coup de cœur")}
                {checkbox("rewatch", "Je l'avais déjà vu")}
            </div>
            <Field id={`${id}-review`} label="Critique (facultative)" error={errors.fields.review}>
                <Textarea
                    id={`${id}-review`}
                    rows={5}
                    maxLength={REVIEW_MAX_LENGTH}
                    className="max-h-64"
                    value={draft.review}
                    aria-invalid={errors.fields.review !== undefined}
                    aria-describedby={errors.fields.review && `${id}-review-error`}
                    onChange={(event) => update("review", event.target.value)}
                />
            </Field>
            {/* Sans critique, il n'y a rien à cacher : la case est désactivée et l'entrée part sans spoiler. */}
            {checkbox("containsSpoilers", "La critique contient des spoilers", !hasReview)}
            <Button type="submit" className="h-11 w-full sm:w-auto sm:px-6" disabled={submitting}>
                {submitLabel}
            </Button>
        </form>
    );
}

// Le formulaire est long : la fenêtre défile sur un petit écran au lieu de sortir de l'écran.
export function LogEntryDialogContent({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
        </DialogContent>
    );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && (
                <p id={`${id}-error`} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
