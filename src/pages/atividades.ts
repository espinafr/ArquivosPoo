import { fetchSpreadsheetData, type SpreadsheetOptions } from '../lib/lessons_parser.ts';

const lessons_list: HTMLElement | null = document.getElementById("lessons-list");
const options: SpreadsheetOptions = {
    spreadsheetIdOrUrl: "1iMUNgtURBd8QIIDOQvcOz6ynSvFrEDTP-_D22h713iA"
};

function clear_list(): void {
    if (!lessons_list) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }
    lessons_list.innerHTML = "";
}

function create_row(row: Record<string, unknown>): void {
    if (!lessons_list) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }
    if (!row["readme"] || !row["titulo"] || !row["descricao"]) {
        return;
    }
    lessons_list.innerHTML += `<a href="${import.meta.env.BASE_URL}/atividade?a=${row["readme"]}" class="border border-dim-foreground p-3 flex flex-col justify-center">
                    <div class="flex justify-between">
                        <p class="font-bold text-md text-colored-foreground">${row["titulo"]}</p>
                        <p class="text-sm text-dim-foreground italic">${row["tipo"] || ""}</p>
                    </div>
                    <p class="text-sm indent-2">${row["descricao"]}</p>
                    <p class="text-right italic text-sm text-dim-foreground">${row["timestamp"] || ""}</p>
                </a>`;
}

async function loadActivities(): Promise<void> {
    try {
        const rows = await fetchSpreadsheetData(options);

        if (rows.length > 0) {
            clear_list();
            rows.forEach((row) => {
                console.log(row);
                create_row(row);
            });
        }
    } catch (error) {
        console.error('Não foi possível carregar as atividades:', error);
    }
}

void loadActivities();