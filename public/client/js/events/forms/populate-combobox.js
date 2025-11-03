import { mostrarErroUI } from "../../utils/dom/error-handler.js";


// Cliente
export async function preencherCbxCliente($form) {
  const $cbx = $form.find("#selectCliente");
  $cbx.empty();
  try {
    const res = await fetch("/api/empresa", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione a Empresa...</option>');
    data.forEach(c => {
      $cbx.append(`<option value="${c.id}">${c.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar clientes:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Empresa");
  }
}

// Supervisor
export async function preencherCbxSupervisor(idEmpresas, $form) {
  const $cbx = $form.find("#selectSupervisor");
  $cbx.empty();
  try {
    const res = await fetch(`/api/supervisor/idEmpresa/${idEmpresas}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o Supervisor...</option>');
    data.forEach(s => {
      $cbx.append(`<option value="${s.id_supervisor}">${s.nome} - ${s.empresa}</option>`);
    });

    if (data.length === 1) {
      $cbx.val(data[0].id_supervisor).trigger("change");
    }
  } catch (err) {
    console.error("Erro carregar supervisores:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Supervisor");
  }
}

// Cidade
export async function preencherCbxCidade(idEmpresas, $form) {
  const $cbx = $form.find("#selectCidade");
  $cbx.empty();
  try {
    const res = await fetch(`/api/cidade/idEmpresa/${idEmpresas}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione a Cidade...</option>');
    data.forEach(c => {
      $cbx.append(`<option value="${c.id_cidade}">${c.nome}</option>`);
    });

    if (data.length === 1) {
      $cbx.val(data[0].id_cidade).trigger("change");
    }
  } catch (err) {
    console.error("Erro carregar cidades:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Cidade");
  }
}

// Responsável
export async function preencherCbxResponsavel() {
  const $cbx = $("#selectResponsavel");
  $cbx.empty();
  try {
    const res = await fetch("/api/colaboradores/responsavel/cbx", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o Responsável...</option>');
    data.forEach(r => {
      $cbx.append(`<option value="${r.id}">${r.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar responsáveis:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Responsável");
  }
}

// Colaborador
export async function preencherCbxColaborador() {
  const $cbx = $("#selectColaborador");
  $cbx.empty();
  try {
    const res = await fetch("/api/colaboradores/cbx", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o Colaborador...</option>');
    data.forEach(c => {
      $cbx.append(`<option value="${c.id}">${c.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar colaboradores:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Colaborador");
  }
}

// Exame
export async function preencherCbxExame() {
  const $cbx = $("#selectExame");
  $cbx.empty();
  try {
    const res = await fetch("/api/exame", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o Exame...</option>');
    data.forEach(e => {
      $cbx.append(`<option value="${e.idexame}">${e.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar exames:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Exame");
  }
}


// Curso
export async function preencherCbxCurso() {
  const $cbx = $("#selectCurso");
  $cbx.empty();
  try {
    const res = await fetch("/api/curso/cbx", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o Curso...</option>');
    data.forEach(c => {
      $cbx.append(`<option value="${c.id}">${c.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar cursos:", err);
    mostrarErroUI("Erro ao tentar preencher combobox Curso");
  }
}

// EPI
export async function preencherCbxEPI() {
  const $cbx = $("#selectEPI");
  $cbx.empty();
  try {
    const res = await fetch("/api/epi", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $cbx.append('<option value="" disabled selected hidden>Selecione o EPI...</option>');
    data.forEach(e => {
      $cbx.append(`<option value="${e.id}">${e.nome}</option>`);
    });
  } catch (err) {
    console.error("Erro carregar EPIs:", err);
    mostrarErroUI("Erro ao tentar preencher combobox EPI");
  }
}
