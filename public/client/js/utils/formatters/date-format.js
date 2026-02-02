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
  return dataInput.slice(0, 10);
}


export function formatarDataISO(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}


export function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia); // mês é 0-based
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
