export async function getFornecedoresMaterial(idMaterial) {
  return $.get(`/api/materiais/os/${idMaterial}/fornecedores`);
}

export async function addFornecedor(data) {
  return $.post("/api/materiais/os/fornecedores", data);
}

export async function updateFornecedor(id, data) {
  return $.ajax({
    url: `/api/materiais/os/fornecedores/${id}`,
    method: "PUT",
    data
  });
}

export async function deleteFornecedor(id) {
  return $.ajax({
    url: `/api/materiais/os/fornecedores/${id}`,
    method: "DELETE"
  });
}

export async function selecionarFornecedor(id) {
  return $.ajax({
    url: `/api/materiais/os/fornecedores/${id}/selecionar`,
    method: "PUT"
  });
}