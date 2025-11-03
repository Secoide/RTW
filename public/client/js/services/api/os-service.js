// /public/client/js/services/api/os-service.js
export async function getDadosOS(id) {
  const res = await fetch(`/api/os/${id}`, {
    method: "GET",
    credentials: "include", // mantém cookie/sessão
  });

  if (!res.ok) {
    throw new Error(`Erro HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();

  if (!data.sucesso) {
    throw new Error(data.mensagem || "Falha ao obter dados da OS.");
  }

  return data; // { sucesso: true, dados: {...} }
}
