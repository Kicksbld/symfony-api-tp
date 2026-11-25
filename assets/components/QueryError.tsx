import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type QueryErrorProps = {
    message: string;
    error: Error;
    onRetry: () => void;
    retrying: boolean;
};

export function QueryError({ message, error, onRetry, retrying }: QueryErrorProps) {
    return (
        <Alert variant="destructive">
            <AlertDescription>
                {message} {error.message}
            </AlertDescription>
            <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={onRetry} disabled={retrying}>
                Réessayer
            </Button>
        </Alert>
    );
}
