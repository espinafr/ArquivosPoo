import { fetchSpreadsheetData, type SpreadsheetOptions } from '../lib/lessons_parser.ts';
import { marked } from 'marked';
import '../styles/atividade.css'

const queryString = window.location.search; 
const urlParams = new URLSearchParams(queryString);

const atividade: string | undefined = urlParams.get('a') ?? undefined;

if (!atividade) {
    window.location.href = `${import.meta.env.BASE_URL}/atividades`;
}

const lesson_div: HTMLElement | null = document.getElementById("lesson-div")

const options: SpreadsheetOptions = {
    spreadsheetIdOrUrl: "1iMUNgtURBd8QIIDOQvcOz6ynSvFrEDTP-_D22h713iA",
    gid: "119440075",
    query: `select * where A = '${atividade}' limit 1`
};

function createLessonMarkdown(content: string): void {
    if (!lesson_div) {
        throw new Error("Div de atividade não encontrada no DOM.");
    }
    const htmlOutput: string = marked.parse(content) as string;
    lesson_div.innerHTML = htmlOutput;
}

async function loadLesson(): Promise<void> {
    try {
        const rows = await fetchSpreadsheetData(options);

        if (rows.length > 0) {
            const content: string = rows[0]['B'] as string;

            if (!content) {
                throw new Error("O markdown foi encontrado mas está vazio.")
            }
            
            createLessonMarkdown(rows[0]['B'] as string);
        } else {
            throw new Error("O markdown não foi encontrado.")
        }
    } catch (error) {
        alert(`Não foi possível carregar a atividade. ${error}`)
        console.error('Não foi possível carregar as atividades:', error);
        window.location.href = `${import.meta.env.BASE_URL}/atividades`;
    }
}

void loadLesson()