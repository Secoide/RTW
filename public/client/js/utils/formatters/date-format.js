// Formatador de datas
export function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toISOString().slice(0, 10);
}

export function formatarData_Semana(dataStr) {
  const dias = [
    "DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA",
    "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"
  ];

  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  const diaSemana = dias[data.getDay()];
  const diaFmt = String(data.getDate()).padStart(2, "0");
  const mesFmt = String(data.getMonth() + 1).padStart(2, "0");

  return `${diaSemana}, ${diaFmt}-${mesFmt}-${ano}`;
}

export function formatDateToInput(dataInput) {
  if (!dataInput) return '';
  const date = new Date(dataInput);
  const year = date.getFullYear();
  // getMonth() retorna 0-11, por isso soma 1 e padStart para 2 dígitos
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatarDataISO(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

export function formatarData(dataISO) {
  const d = new Date(dataISO);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}