import { Field } from "@/components/form/Field";
import { fieldDescription } from "@/components/form/field-description";
import { Input } from "@/components/ui/input";

type FormFieldProps = {
    id: string;
    label: string;
    hint?: string;
    type?: string;
    autoComplete: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
};

export function FormField({ id, label, hint, type = "text", autoComplete, value, error, onChange }: FormFieldProps) {
    return (
        <Field id={id} label={label} hint={hint} error={error}>
            <Input
                id={id}
                type={type}
                autoComplete={autoComplete}
                required
                value={value}
                aria-invalid={error !== undefined}
                aria-describedby={fieldDescription(id, { hint, error })}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}
