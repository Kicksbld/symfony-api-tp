import { parsePositiveInteger } from "@/lib/numbers";

export const DIARY_MIN_YEAR = 1900;
export const DIARY_MAX_YEAR = 2100;

export type DiaryFilters = {
    year: number | null;
    month: number | null;
};

export function readDiaryFilters(searchParams: URLSearchParams): DiaryFilters {
    const year = parsePositiveInteger(searchParams.get("year") ?? "");
    const month = parsePositiveInteger(searchParams.get("month") ?? "");

    if (year === null || year < DIARY_MIN_YEAR || year > DIARY_MAX_YEAR) {
        return { year: null, month: null };
    }

    return { year, month: month !== null && month <= 12 ? month : null };
}

export function diaryFilterParams({ year, month }: DiaryFilters): Record<string, string> {
    if (year === null) {
        return {};
    }

    return month === null ? { year: String(year) } : { year: String(year), month: String(month) };
}
