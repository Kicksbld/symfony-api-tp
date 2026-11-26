import { useEffect, useState } from "react";

export const SEARCH_DEBOUNCE_DELAY = 300;

// Les recherches partent quand la frappe s'arrête, pas à chaque lettre.
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_DELAY): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedValue(value), delay);

        return () => window.clearTimeout(timeout);
    }, [value, delay]);

    return debouncedValue;
}
