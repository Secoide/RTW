// /public/client/js/services/api/colaboradores-api.js

// Nova versão da função
export async function get_dadosColab(dataDia, osID) {
  try {
    const res = await fetch(`/api/colaboradores/dadosCPFRG/${osID}/${dataDia}`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const dados = await res.json();
    return dados.map(colab => ({
      nome: colab.nome,
      cpf: colab.cpf,
      rg: colab.rg
    }));
  } catch (err) {
    console.error("Erro ao buscar dados dos colaboradores:", err);
    return [];
  }
}
