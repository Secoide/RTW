// /public/client/js/services/api/exames.api.js

export async function baixarExame(idFuncionarioExame) {
    try {
        const res = await fetch(`/api/exame/download/${idFuncionarioExame}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Erro ao baixar exame');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `exame_${idFuncionarioExame}.pdf`; // nome do arquivo
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Erro no download do exame:', err);
        throw err;
    }
}
