import { clearSpreadsheetData, fetchSpreadsheetData, type SpreadsheetOptions, type SpreadsheetRow } from '../lib/exercises_parser.ts';

const exercises_list: HTMLElement | null = document.getElementById("exercises-list");
const reload_button = document.getElementById("reload-exercises");
const search_input: HTMLInputElement | null = document.getElementById("exercise-search") as HTMLInputElement | null;
const options: SpreadsheetOptions = {
    spreadsheetIdOrUrl: "1iMUNgtURBd8QIIDOQvcOz6ynSvFrEDTP-_D22h713iA"
};

let exercises: SpreadsheetRow[] = [];

const searchable_fields = ["titulo", "tipo", "descricao", "readme", "timestamp"] as const;

function normalize_text(value: unknown): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();
}

function matches_search(row: SpreadsheetRow, search_term: string): boolean {
    const terms = normalize_text(search_term).trim().split(/\s+/).filter(Boolean);
    const searchable_text = searchable_fields
        .map((field) => normalize_text(row[field]))
        .join(" ");

    return terms.every((term) => searchable_text.includes(term));
}

function clear_list(is_error: boolean = false): void {
    if (!exercises_list) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }
    if (is_error) {
        exercises_list.innerHTML = "<p>Houve um erro ao carregar as atividades. <a class=\"link\" onclick=\"location.reload()\">Recarregue a página</a> ou consulte o console.</p>";
    } else {
        exercises_list.innerHTML = "";
    }
}

function create_row(row: SpreadsheetRow): void {
    if (!exercises_list) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }
    if (!row["readme"] || !row["titulo"] || !row["descricao"]) {
        return;
    }
    exercises_list.innerHTML += `<a href="${import.meta.env.BASE_URL}atividade?a=${row["readme"]}" class="border border-dim-foreground p-3 flex flex-col justify-center">
                    <div class="flex justify-between">
                        <p class="font-bold text-md text-colored-foreground">${row["titulo"]}</p>
                        <p class="text-sm text-dim-foreground italic">${row["tipo"] || ""}</p>
                    </div>
                    <p class="text-sm indent-2">${row["descricao"]}</p>
                    <p class="text-right italic text-sm text-dim-foreground">${row["timestamp"] || ""}</p>
                </a>`;
}

function render_exercises(): void {
    if (!exercises_list) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }

    const search_term = search_input?.value ?? "";
    const filtered_exercises = exercises.filter((row) => matches_search(row, search_term));
    clear_list();

    if (filtered_exercises.length === 0) {
        exercises_list.innerHTML = "<p>Nenhuma atividade encontrada.</p>";
        return;
    }

    filtered_exercises.forEach((row) => create_row(row));
}

async function loadExercises(forceReload = false): Promise<void> {
    try {
        if (forceReload) {
            clearSpreadsheetData(options);
        }

        const rows = await fetchSpreadsheetData(options);
            
        exercises = rows;
        render_exercises();
    } catch (error) {
        console.error('Não foi possível carregar as atividades:', error);
        clear_list(true);
    }
}

reload_button?.addEventListener('click', () => {
    void loadExercises(true);
});

search_input?.addEventListener('input', render_exercises);

void loadExercises();