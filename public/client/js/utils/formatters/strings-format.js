/**
 * Reduz nome completo para formato "Primeiro SobrenomeInicial."
 * Exemplo: "Guilherme Augusto Schvaickardt" → "Guilherme S."
 */
export function reduzirNome(nomeCompleto) {
  if (!nomeCompleto) return "";

  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) {
    return partes[0]; // só um nome
  }

  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];
  const inicial = ultimo.charAt(0).toUpperCase();

  return `${primeiro} ${inicial}.`;
}


// Formata CPF
export function formatarCPF(cpf = "") {
  cpf = cpf.toString().replace(/\D/g, ""); // só números

  // Aplica a máscara enquanto digita
  if (cpf.length > 3) {
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  }
  if (cpf.length > 6) {
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  }
  if (cpf.length > 9) {
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return cpf;
}



// Copiar texto para clipboard
export function copiarTexto(texto, msg = "Texto copiado!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => Swal.fire({
        icon: "success",
        title: "Programação",
        theme: "dark",
        text: msg
      }))
      .catch(() => fallbackCopy(texto, msg));
  } else {
    fallbackCopy(texto, msg);
  }
}

function fallbackCopy(texto, msg) {
  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.style.position = "fixed";
  textarea.style.opacity = 0;
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      theme: "dark",
      text: msg
    });
  } catch (err) {
    alert("Erro ao copiar: " + err);
  }
  document.body.removeChild(textarea);
}
