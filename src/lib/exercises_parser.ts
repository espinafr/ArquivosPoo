import { readValue, removeValue, saveValue } from './persist.ts';

type GoogleCell = {
    v?: unknown;
};

type GoogleColumn = {
    label?: string;
    id?: string;
};

type GoogleTable = {
    cols: GoogleColumn[];
    rows: GoogleRow[];
};

type GoogleRow = {
    c: (GoogleCell | null)[];
};

type GoogleResponse = {
    status: string;
    errors?: { message?: string }[];
    table?: GoogleTable;
};

export type SpreadsheetOptions = {
    spreadsheetIdOrUrl: string;
    gid?: string | number;
    query?: string;
    hasHeaderRow?: boolean;
    cacheTtlMs?: number;
};

export interface SpreadsheetRow {
    [columnName: string]: unknown;
}

const defaultCacheTtlMs = 24 * 60 * 60 * 1000; // 1 dia
const cacheKeyPrefix = 'arquivos-poo:spreadsheet:';

function getSpreadsheetId(value: string): string {
    const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1] ?? value.trim();
}

function sheetUrl({ spreadsheetIdOrUrl, gid = 0, query }: SpreadsheetOptions): string {
    const params = new URLSearchParams({ gid: String(gid), tqx: 'out:json' });

    if (query) {
        params.set('tq', query);
    }

    return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(getSpreadsheetId(spreadsheetIdOrUrl))}/gviz/tq?${params}`;
}

function parseGoogleResponse(text: string): GoogleResponse {
    const responseStart = text.indexOf('(');
    const responseEnd = text.lastIndexOf(')');

    if (responseStart === -1 || responseEnd <= responseStart) {
        throw new Error('Resposta inválida do Google Sheets.');
    }

    return JSON.parse(text.slice(responseStart + 1, responseEnd)) as GoogleResponse;
}

function createHeaders(columns: GoogleColumn[]): string[] {
    const usedHeaders = new Map<string, number>();

    return columns.map((column, index) => {
        const baseHeader = column.label?.trim() || column.id?.trim() || `column_${index + 1}`;
        const occurrences = (usedHeaders.get(baseHeader) ?? 0) + 1;
        usedHeaders.set(baseHeader, occurrences);
        return occurrences === 1 ? baseHeader : `${baseHeader}_${occurrences}`;
    });
}

function createCacheKey(options: SpreadsheetOptions): string {
    return `${cacheKeyPrefix}${JSON.stringify({
        spreadsheetIdOrUrl: getSpreadsheetId(options.spreadsheetIdOrUrl),
        gid: options.gid ?? 0,
        query: options.query ?? '',
    })}`;
}

async function requestSpreadsheetData(options: SpreadsheetOptions): Promise<SpreadsheetRow[]> {
    const response = await fetch(sheetUrl(options));

    if (!response.ok) {
        throw new Error(`Não foi possível acessar a planilha (${response.status}).`);
    }

    const data = parseGoogleResponse(await response.text());

    if (data.status !== 'ok' || !data.table) {
        const message = data.errors?.map((error) => error.message).filter(Boolean).join('; ');
        throw new Error(message || 'A Google Sheets retornou uma resposta sem dados.');
    }

    const hasHeaderRow = options.hasHeaderRow ?? true;
    const headers = hasHeaderRow && data.table.rows.length > 0
        ? getHeaderRow(data.table.rows[0])
        : createHeaders(data.table.cols);
    const rows = hasHeaderRow ? data.table.rows.slice(1) : data.table.rows;

    return rows.map((row) =>
        Object.fromEntries(
            headers.map((header, index) => [header, row.c[index]?.v ?? null]),
        ),
    );
}

export async function fetchSpreadsheetData(options: SpreadsheetOptions): Promise<SpreadsheetRow[]> {
    const cacheKey = createCacheKey(options);
    const savedData = readValue<SpreadsheetRow[]>(cacheKey);

    if (savedData) {
        return savedData;
    }

    const freshData = await requestSpreadsheetData(options);
    saveValue(cacheKey, freshData, options.cacheTtlMs ?? defaultCacheTtlMs);
    return freshData;
}

export function clearSpreadsheetData(options: SpreadsheetOptions): void {
    removeValue(createCacheKey(options));
}

function getHeaderRow(row: GoogleRow): string[] {
    return row.c.map((cell, index) => String(cell?.v ?? `column_${index + 1}`).trim());
}