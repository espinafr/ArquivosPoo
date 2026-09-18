import { clearSpreadsheetData, fetchSpreadsheetData, type SpreadsheetOptions, type SpreadsheetRow } from '../lib/exercises_parser.ts';

const exercises_list: HTMLElement | null = document.getElementById("exercises-list");
const reload_button = document.getElementById("reload-exercises");
const options: SpreadsheetOptions = {
    spreadsheetIdOrUrl: "1iMUNgtURBd8QIIDOQvcOz6ynSvFrEDTP-_D22h713iA"
};

function clear_list(is_error: Boolean = false): void {
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

async function loadExercises(forceReload = false): Promise<void> {
    try {
        if (forceReload) {
            clearSpreadsheetData(options);
        }

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
        clear_list(true);
    }
}

reload_button?.addEventListener('click', () => {
    void loadExercises(true);
});

void loadExercises();