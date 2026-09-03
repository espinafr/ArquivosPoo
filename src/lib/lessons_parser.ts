type GoogleCell = {
    v?: unknown;
};

type GoogleColumn = {
    label?: string;
    id?: string;
};

type GoogleTable = {
    cols: GoogleColumn[];
    rows: Array<{ c: Array<GoogleCell | null> }>;
};

type GoogleResponse = {
    status: string;
    errors?: Array<{ message?: string }>;
    table?: GoogleTable;
};

export type SpreadsheetOptions = {
    spreadsheetIdOrUrl: string;
    gid?: string | number;
    query?: string;
};

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

export async function fetchSpreadsheetData(options: SpreadsheetOptions, ): Promise<Array<Record<string, unknown>>> {
    const response = await fetch(sheetUrl(options));

    if (!response.ok) {
        throw new Error(`Não foi possível acessar a planilha (${response.status}).`);
    }

    const data = parseGoogleResponse(await response.text());

    if (data.status !== 'ok' || !data.table) {
        const message = data.errors?.map((error) => error.message).filter(Boolean).join('; ');
        throw new Error(message || 'A Google Sheets retornou uma resposta sem dados.');
    }

    const headers = createHeaders(data.table.cols);

    return data.table.rows.map((row) =>
        Object.fromEntries(
        headers.map((header, index) => [header, row.c[index]?.v ?? null]),
        ),
    );
}
