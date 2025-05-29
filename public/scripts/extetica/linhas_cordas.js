// LINHAS LeaderLine
const origem = document.getElementById('origem');
const destinos = document.querySelectorAll('.destino');
const tempEnd = document.createElement('div');
document.body.appendChild(tempEnd);

tempEnd.style.position = 'absolute';
tempEnd.style.width = '1px';
tempEnd.style.height = '1px';

let tempLine = null;
let isDragging = false;
let linhas = [];

origem.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    tempEnd.style.left = e.clientX + 'px';
    tempEnd.style.top = e.clientY + 'px';

    tempLine = new LeaderLine(origem, tempEnd, {
        path: 'fluid',
        color: 'gray',
        size: 2,
        startPlug: 'disc',
        endPlug: 'arrow3',
        dash: { animation: true },
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(e) {
    if (!isDragging) return;

    tempEnd.style.left = e.clientX + 'px';
    tempEnd.style.top = e.clientY + 'px';
    tempLine.position();

    // Destino recebe destaque se estiver sendo "hovered"
    destinos.forEach(dest => {
        const r = dest.getBoundingClientRect();
        const hover = (
            e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top && e.clientY <= r.bottom
        );
        dest.classList.toggle('highlight', hover);
    });
}

function onMouseUp(e) {
    if (!isDragging) return;

    tempLine.remove();
    tempLine = null;

    destinos.forEach(dest => dest.classList.remove('highlight'));

    destinos.forEach(dest => {
        const r = dest.getBoundingClientRect();
        const inside = (
            e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top && e.clientY <= r.bottom
        );

        if (inside) {
            // Cria uma linha real de origem para destino
            const linhaReal = new LeaderLine(origem, dest, {
                path: 'fluid',
                color: 'green',
                size: 2,
                startPlug: 'disc',
                endPlug: 'arrow3',
                dash: { animation: true },
            });

            const colaboradorId = origem.dataset.id;
            const nivel = dest.dataset.nivel;

            // AJAX para salvar o nível no banco
            $.ajax({
                url: '/api/salvar_nivelacesso_colab',
                method: 'POST',
                data: {
                    colaborador_id: colaboradorId,
                    nivel: nivel
                },
                success: function (resposta) {
                    console.log('Salvo com sucesso:', resposta);
                },
                error: function (err) {
                    console.error('Erro ao salvar:', err);
                }
            });

            // Remover linha com duplo clique no destino
            const removerLinha = () => {
                linhaReal.remove();
                linhas = linhas.filter(l => l !== linhaReal);
                dest.removeEventListener('dblclick', removerLinha);
            };
            dest.addEventListener('dblclick', removerLinha);

            linhas.push(linhaReal);
        }
    });

    isDragging = false;
}
