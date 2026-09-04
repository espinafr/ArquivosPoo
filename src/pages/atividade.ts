import { fetchSpreadsheetData, type SpreadsheetOptions } from '../lib/lessons_parser.ts';
import { marked } from 'marked';
import '../styles/atividade.css'

const asciinemaIdPattern = /^[a-zA-Z0-9_-]+$/;

marked.use({
    renderer: {
        code({ text, lang }) {
            if (lang?.trim().toLowerCase() === 'asciinema') {
                const asciinemaId = text.trim();

                if (!asciinemaIdPattern.test(asciinemaId)) {
                    return '<p class="asciinema-error">Vídeo do Asciinema inválido.</p>';
                }

                return `<div class="asciinema-player" data-asciinema-id="${asciinemaId}"></div>`;
            }

            return false;
        },
    },
});

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
    addAsciinemaPlayers(lesson_div);
}

function addAsciinemaPlayers(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>('[data-asciinema-id]').forEach((player) => {
        const asciinemaId = player.dataset.asciinemaId;
        if (!asciinemaId) {
            return;
        }

        const script = document.createElement('script');
        script.src = `https://asciinema.org/a/${asciinemaId}.js`;
        script.id = `asciicast-${asciinemaId}`;
        script.async = true;
        player.appendChild(script);
    });
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