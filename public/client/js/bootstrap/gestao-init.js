
import {
    preencherCbxCliente,
    preencherCbxResponsavel
} from "../events/forms/populate-combobox.js";

let lastCols = [];

export function initGestao() {
    // ========================== CONFIG ==========================
    const ENTIDADES = ["EPI", "Exame", "Curso", "Empresa", "Supervisor", "Cidade", "OS", "Cargos", "Setor", "Fornecedor"];
    const BASE_URL = "/api"; // 🔧 troque pelo endpoint real se necessário

    // ========================== ESTADO ==========================
    let entidadeAtual = "OS";
    let dados = [];

    const $tabs = $(".tab");
    const $thead = $("#theadRow");
    const $tbody = $("#tbody");
    const $empty = $("#empty");
    const $btnReload = $("#btnReload");
    const $btnNovo = $("#btnNovo");
    const $searchInput = $("#search");
    const $btnToggleChart = $("#btnToggleChart");

    // Ícones SVG preto e branco
    const iconeEditar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M2 12.5L3 8l5-5 3 3-5 5zM14 14H0"/></svg>`;
    const iconeApagar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M3 4h10M5 4V2h4v2m1 0v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z"/></svg>`;
    const iconeSalvar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M3 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM4 2v4h6V2"/></svg>`;
    const iconeCancelar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M2 2l10 10M12 2L2 12"/></svg>`;
    const iconeAdd = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" stroke="white" stroke-width="2"><path d="M7 1v12M1 7h12"/></svg>`;



    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    // ========================== ABAS ==========================
    $tabs.on("click", function () {
        $tabs.removeClass("active");
        $(this).addClass("active");

        entidadeAtual = $(this).data("entity");
        $searchInput.val("");

        $("#gestao").attr("data-entity", entidadeAtual);

        carregarTabela().then(() => {
            if (entidadeAtual === "Empresa") {
                habilitarResizeColunasEmpresa();
            }
        });
    });


    // ========================== CARREGAR TABELA ==========================
    async function carregarTabela() {
        $thead.empty();
        $tbody.empty();
        $empty.hide();

        try {
            if (entidadeAtual === "Empresa") {
                const data = await $.ajax({
                    url: `${BASE_URL}/empresa`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });
                const parseMaybeJSON = (v) => {
                    if (Array.isArray(v)) return v;
                    if (typeof v === "string") {
                        const s = v.trim();
                        if (s.startsWith("[") && s.endsWith("]")) {
                            try { return JSON.parse(s); } catch { /* ignore */ }
                        }
                    }
                    return null;
                };

                const toList = (val) => {
                    const parsed = parseMaybeJSON(val);
                    if (parsed) return parsed;

                    if (Array.isArray(val)) return val;
                    if (val == null) return [];
                    if (typeof val === "object") {
                        return [{
                            id: val.id ?? val.id_cidades ?? val.id_cidade ?? val.id_supervisores ?? val.id_supervisor ?? null,
                            nome: val.nome ?? val.name ?? String(val.id ?? "")
                        }];
                    }
                    return [{ id: null, nome: String(val) }];
                };

                const uniqueBy = (arr) => {
                    const seen = new Set();
                    const out = [];
                    for (const x of arr) {
                        const id = (x && (x.id ?? null));
                        const key = id != null ? `id:${id}` : `nome:${(x?.nome ?? "").toLowerCase()}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            out.push({ id: id ?? null, nome: x?.nome ?? x?.name ?? String(x?.id ?? "") });
                        }
                    }
                    return out;
                };

                const normList = (maybeArray, singularObj /*, singularName */) => {
                    let list = toList(maybeArray);
                    if (!list.length && singularObj) list = toList(singularObj);
                    list = uniqueBy(list).sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
                    return list;
                };

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id ?? e.id_empresas ?? null,
                    nome: e.nome ?? e.razao_social ?? "",
                    cidades: normList(e.cidades, e.cidade, "cidade"),
                    supervisores: normList(e.supervisores, e.supervisor, "supervisor"),
                    integracao: e.integracao ?? 0,
                    liberacao: e.liberacao ?? 0,
                    seguranca: e.seguranca ?? 0,
                }));
            } else if (entidadeAtual === "EPI") {
                const data = await $.ajax({
                    url: `${BASE_URL}/epi`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id ?? e.id_empresas ?? null,
                    nome: e.nome ?? e.razao_social ?? "",
                    obrigatorio: e.obrigatorio == null ? null : (e.obrigatorio == '1' ? 'SIM' : 'Não'),
                }));
            } else if (entidadeAtual === "Exame") {
                const data = await $.ajax({
                    url: `${BASE_URL}/exame`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.idexame ?? null,
                    nome: e.nome ?? e.razao_social ?? "",
                    descricao: e.descricao ?? null,
                }));
            } else if (entidadeAtual === "Curso") {
                const data = await $.ajax({
                    url: `${BASE_URL}/curso`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id ?? null,
                    nome: e.nome ?? "",
                    descricao: e.descricao ?? null,
                }));
            } else if (entidadeAtual === "Supervisor") {
                const data = await $.ajax({
                    url: `${BASE_URL}/supervisor`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id_supervisores ?? null,
                    nome: e.nome ?? "",
                    email: e.email ?? null,
                    telefone: e.telefone ?? null,
                }));
            } else if (entidadeAtual === "Cidade") {
                const data = await $.ajax({
                    url: `${BASE_URL}/cidade`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id_cidades ?? null,
                    nome: e.nome ?? "",
                    estado: e.estado ?? "",
                }));
            } else if (entidadeAtual === "OS") {

                const data = await $.ajax({
                    url: `${BASE_URL}/os`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id_OSs ?? null,
                    status: (() => {
                        const map = {
                            0: "⚪ Sem responsável",
                            1: "🟠 Aguardando",
                            2: "🔵 Em execução",
                            3: "🔴 Parado",
                            4: "🟢 Concluído",
                            5: "🟡 Em espera",
                            6: "⚫ Cancelado"
                        };
                        return map[e.statuss] ?? e.statuss;
                    })(),
                    descricao: e.descricao ?? "",
                    empresa: e.nomeEmpresa,
                    supervisor: e.nomeSupervisor,
                    cidade: e.cidade,
                    responsavel: e.lider,
                    orcado: e.orcado,
                    criado: e.mesCriado,
                    concluido: e.mesConcluido,
                }));
            } else if (entidadeAtual === "Cargo") {
                const data = await $.ajax({
                    url: `${BASE_URL}/cargo`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id,
                    nome: e.nome,
                    nivel: e.nivel_acesso,
                    disponivel: !!e.ativo_colaborador
                }));
            } else if (entidadeAtual === "Setor") {
                const data = await $.ajax({
                    url: `${BASE_URL}/setor`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });
                const parseMaybeJSON = (v) => {
                    if (Array.isArray(v)) return v;
                    if (typeof v === "string") {
                        const s = v.trim();
                        if (s.startsWith("[") && s.endsWith("]")) {
                            try { return JSON.parse(s); } catch { /* ignore */ }
                        }
                    }
                    return null;
                };

                const toList = (val) => {
                    const parsed = parseMaybeJSON(val);
                    if (parsed) return parsed;

                    if (Array.isArray(val)) return val;
                    if (val == null) return [];
                    if (typeof val === "object") {
                        return [{
                            id: val.id ?? val.id_cargos ?? val.id_cargo ?? null,
                            nome: val.nome ?? val.cargo ?? String(val.id ?? "")
                        }];
                    }
                    return [{ id: null, nome: String(val) }];
                };

                const uniqueBy = (arr) => {
                    const seen = new Set();
                    const out = [];

                    for (const x of arr) {
                        const id = x?.id ?? null;
                        const nome = x?.nome ?? x?.cargo ?? String(x?.id ?? "");

                        const key = id != null
                            ? `id:${id}`
                            : `nome:${nome.toLowerCase()}`;

                        if (!seen.has(key)) {
                            seen.add(key);
                            out.push({
                                id,
                                nome
                            });
                        }
                    }

                    return out;
                };


                const normList = (maybeArray, singularObj /*, singularName */) => {
                    let list = toList(maybeArray);
                    if (!list.length && singularObj) list = toList(singularObj);
                    list = uniqueBy(list).sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
                    return list;
                };

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id ?? e.id_catnvl ?? null,
                    nome: e.nome ?? "",
                    cargos: normList(e.cargos, e.cargo),
                    nivel: e.nivel_acesso
                }));
            } else if (entidadeAtual === "Fornecedor") {
                const data = await $.ajax({
                    url: `${BASE_URL}/fornecedor`,
                    method: "GET",
                    xhrFields: { withCredentials: true }
                });

                dados = (Array.isArray(data) ? data : []).map(e => ({
                    id: e.id ?? null,
                    nome: e.nome ?? "",
                    email: e.email ?? null,
                    telefone: e.telefone ?? null,
                    icms: e.icms ?? null,
                }));
            }
            else {
                dados = getDadosFake(entidadeAtual);
            }

            if (!Array.isArray(dados) || !dados.length) {
                $empty.text("Nenhum dado encontrado.").show();
                return;
            }

            // Cabeçalho
            lastCols = Object.keys(dados[0]);
            const cols = lastCols.concat("Ações");
            const $fragHead = $(document.createDocumentFragment());
            cols.forEach(col => {
                const $th = $("<th>").text(col);
                if (col === "Ações") $th.addClass("col-acoes");
                $fragHead.append($th);
            });
            $thead.append($fragHead);

            // Linhas
            renderLinhasTabela();

            // 🔎 Reaplica filtro se houver texto digitado
            const termoAtual = $searchInput.val();
            if (termoAtual) {
                aplicarFiltro(termoAtual);
            }

            // ======== Cards de resumo (Aba OS) / Total (demais abas) ========
            const $resumo = $("#resumo");
            const $right = $(".toolbar .right");

            if (entidadeAtual === "OS") {
                atualizarCardsResumo(); // 🔄 chamada única
                atualizarGraficoOS();
                $btnToggleChart.show(); // mostra botão apenas na aba OS
                $("#totalCount").remove();
            } else {
                // Remove cards e mostra total simples
                $resumo.hide().empty();
                $("#totalCount").remove();
                const total = dados.length;
                $right.prepend(`<span id="totalCount">Total: ${total}</span>`);
                $btnToggleChart.hide(); // oculta nas demais abas
                $("#osChartContainer").hide(); // também oculta o gráfico se trocar de aba
                $btnToggleChart.text("📉 Mostrar Gráfico");
            }




            // ========================== ORDENAR COLUNAS (CLICK NO CABEÇALHO) ==========================
            $thead.find("th").each(function (index) {
                const $th = $(this);
                if ($th.text().toLowerCase() === "ações") return;

                let orderState = 0;
                $th.css("cursor", "pointer");
                $th.off("click").on("click", function () {
                    orderState = orderState === 1 ? -1 : 1;

                    $thead.find("th").not($th).each(function () {
                        $(this).text($(this).text().replace(/[▲▼]/g, "").trim());
                        $(this).data("orderState", 0);
                    });

                    const textoOriginal = $th.text().replace(/[▲▼]/g, "").trim();
                    const indicador = orderState === 1 ? " ▲" : " ▼";
                    $th.text(textoOriginal + indicador);
                    $th.data("orderState", orderState);

                    const colName = lastCols[index];
                    if (!colName) return;

                    dados.sort((a, b) => {
                        let va = a[colName];
                        let vb = b[colName];
                        const na = parseFloat(va);
                        const nb = parseFloat(vb);
                        if (!isNaN(na) && !isNaN(nb)) return orderState * (na - nb);
                        return orderState * String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR", { numeric: true });
                    });

                    // ✅ usa função centralizada
                    renderLinhasTabela();
                });
            });;



        } catch (e) {
            $empty.text("Erro ao carregar dados.").show();
            console.error(e);
        }
    }

    // ======== Render de célula de chips (cidades/supervisores) ========
    function renderChipsCell($td, cliente, campo, singular = false) {
        $td.empty();
        const $box = $("<div>").addClass("chips");
        const lista = normalizeToList(cliente[campo], singular);

        lista.forEach(obj => {
            const $chip = $("<span>").addClass("chip");
            $chip.html(
                `<span class="label">${obj.nome ?? obj.name ?? String(obj)}</span>
         <button class="x" title="Remover" data-action="chip-del" data-id="${cliente.id}" data-kind="${campo}" data-relid="${obj.id}">x</button>`
            );
            $box.append($chip);
        });

        const $addBtn = $("<button>").addClass("btn-plus").text("+").attr({
            "title": "Adicionar",
            "data-action": "chip-add",
            "data-id": cliente.id,
            "data-kind": campo
        })


        $box.append($addBtn);
        $td.append($box);
    }

    function normalizeToList(value, singular = false) {
        if (Array.isArray(value)) {
            return value.map(v => (typeof v === "object" ? v : { id: null, nome: String(v) }));
        }
        if (value == null) return [];
        if (typeof value === "object") return [value];
        return [singular ? { id: null, nome: String(value) } : { id: null, nome: String(value) }];
    }

    function formatCell(v, campo = "") {
        if (v == null) return "";

        // Se for telefone → aplica máscara (51) 9 9999-9999
        if (campo.toLowerCase().includes("telefone") || campo.toLowerCase().includes("celular")) {
            const num = String(v).replace(/\D/g, ""); // remove não-dígitos
            if (num.length >= 10) {
                const ddd = num.slice(0, 2);
                const n1 = num.slice(2, 3);
                const n2 = num.slice(3, 7);
                const n3 = num.slice(7, 11);
                return `(${ddd}) ${n1} ${n2}-${n3}`;
            }
            return v;
        }

        if (typeof v === "object") {
            if (Array.isArray(v)) return v.map(x => (typeof x === "object" ? (x.nome ?? x.name ?? x.id) : x)).join(", ");
            return v.nome ?? v.name ?? v.id ?? JSON.stringify(v);
        }
        // 🔹 Formata datas no padrão YYYY-MM-DD ou YYYY-MM → DD/MM/YYYY
        if (campo.toLowerCase().includes("criado") || campo.toLowerCase().includes("concluido")) {
            const match = String(v).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
            if (match) {
                const ano = match[1], mes = match[2], dia = match[3] || "01";
                return `${dia}/${mes}/${ano}`;
            }
        }
        return String(v);
    }


    // ========================== DELEGAÇÃO TABELA ==========================
    $tbody.on("click", "button[data-action]", function (ev) {
        ev.preventDefault();
        const $btn = $(this);
        const id = Number($btn.data("id"));
        const acao = $btn.data("action");

        // === EDITAR ===
        if (acao === "editar") {
            editar(id);
            return;
        }

        // === APAGAR ===
        if (acao === "apagar") {
            apagar(id);
            return;
        }

        // === ESPECÍFICO PARA EMPRESA e SETOR ===
        if (entidadeAtual === "Empresa" || entidadeAtual === "Setor") {
            if (acao === "chip-add") {
                const $td = $btn.closest("td");
                openChipAdder($td, id, $btn.data("kind"));
            } else if (acao === "chip-del") {
                const relId = Number($btn.data("relid"));
                const kind = $btn.data("kind");
                removeAssociation(id, kind, relId).then(carregarTabela);
            }
        }
    });


    // ======== Adicionar item (inline select) ========
    async function openChipAdder($td, clienteId, kind /* 'cidades' | 'supervisores' | 'cidade' | 'supervisor' */) {
        if ($td.find(".inline-add").length) return;
        const $chipsBox = $td.find(".chips");
        const $addBtn = $chipsBox.find(".btn-plus"); // botão +

        // 🔹 Esconde o botão enquanto o combobox é exibido
        $addBtn.hide();
        const $wrap = $("<span>").addClass("inline-add");
        const $sel = $("<select>").html(`<option value="">— selecione —</option>`);

        try {
            const tipo = String(kind).toLowerCase();

            const options = tipo.startsWith("cidade")
                ? await fetchCidades()
                : tipo.startsWith("cargo")
                    ? await fetchCargos()
                    : await fetchSupervisores();

            (options || []).forEach(o => {
                $sel.append($("<option>").val(o.id).text(`${o.nome ?? o.name ?? o.id}`));
            });
        } catch (e) {
            Toast.fire({
                icon: "error",
                theme: 'dark',
                title: "Falha ao carregar opções."
            });
            console.error(e);
            // 🔹 Reexibe o botão se deu erro
            $addBtn.show();
            return;
        }

        const $save = $("<button>").addClass("save").html(`${iconeSalvar}`).attr({ "title": "Salvar" });
        const $cancel = $("<button>").addClass("cancel").html(`${iconeCancelar}`).attr({ "title": "Cancelar" });
        $wrap.append($sel, $save, $cancel);
        $td.find(".chips").append($wrap);

        // 🔹 Ações de salvar/cancelar
        $cancel.on("click", () => {
            $wrap.remove();
            $addBtn.show(); // 🔹 Reexibe o botão “+” ao cancelar
        });

        $save.on("click", async () => {
            const val = $sel.val() ? Number($sel.val()) : null;
            if (!val) {
                Toast.fire({
                    icon: "warning",
                    theme: 'dark',
                    title: "Selecione uma opção."
                }); return;
            }
            await addAssociation(clienteId, kind, val);
            await carregarTabela();
        });
    }

    // ======== Ações padrões ========
    // ======== Edição inline (versão corrigida) ========
    async function editar(id) {
        const $linha = $tbody.find(`button[data-id='${id}'][data-action='editar']`).closest("tr");
        if (!$linha.length) return;

        // Evita múltiplas edições simultâneas
        if ($tbody.find("input[data-editing='true']").length) {
            Toast.fire({
                icon: "warning",
                theme: 'dark',
                title: "Conclua ou cancele a edição atual antes de editar outro registro."
            });
            return;
        }

        // ⭐ Adiciona destaque visual
        $linha.addClass("editing-row");

        // Captura dados atuais — incluindo estado dos checkboxes
        const dadosOriginais = {};
        $linha.find("td").each((i, td) => {
            const colName = lastCols[i];
            if (!colName) return;

            const $td = $(td);

            // Se a célula contém um checkbox, captura o estado checked
            const $chk = $td.find("input[type='checkbox']");
            if ($chk.length) {
                dadosOriginais[colName] = $chk.prop("checked") ? "1" : "0";
                return;
            }

            // Caso padrão: texto da célula
            dadosOriginais[colName] = $td.text().trim();
        });

        // Desabilita checkboxes durante edição (caso existam)
        $linha.find("input[type='checkbox']").prop("disabled", true);


        function renderDependentesOS($linha, emp, dadosOriginais) {

            // índices das colunas
            const idxSup = lastCols.indexOf("supervisor");
            const idxCid = lastCols.indexOf("cidade");

            // células (DECLARADAS UMA ÚNICA VEZ)
            const $tdSup = $linha.find("td").eq(idxSup);
            const $tdCid = $linha.find("td").eq(idxCid);

            // 🔹 limpa qualquer estado anterior
            $tdSup.removeAttr("data-clear data-single-id data-single-field").empty();
            $tdCid.removeAttr("data-clear data-single-id data-single-field").empty();

            // ===== Supervisor =====
            if (emp.supervisores?.length > 1) {
                const $selSup = $("<select>")
                    .attr({ "data-field": "supervisor", "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });

                $selSup.append(`<option value="">— selecione —</option>`);
                emp.supervisores.forEach(s =>
                    $selSup.append(`<option value="${s.id}">${s.nome}</option>`)
                );

                const supAtual = emp.supervisores.find(
                    s => s.nome === dadosOriginais.supervisor || s.id == dadosOriginais.supervisor
                );
                if (supAtual) $selSup.val(supAtual.id);

                $tdSup.append($selSup);
            }
            else if (emp.supervisores?.length === 1) {
                $tdSup
                    .text(emp.supervisores[0].nome)
                    .attr("data-single-field", "supervisor")
                    .attr("data-single-id", emp.supervisores[0].id);
            }
            else {
                $tdSup
                    .text("—")
                    .attr("data-clear", "supervisor");
            }

            // ===== Cidade =====
            if (emp.cidades?.length > 1) {
                const $selCid = $("<select>")
                    .attr({ "data-field": "cidade", "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });

                $selCid.append(`<option value="">— selecione —</option>`);
                emp.cidades.forEach(c =>
                    $selCid.append(`<option value="${c.id}">${c.nome}</option>`)
                );

                const cidAtual = emp.cidades.find(
                    c => c.nome === dadosOriginais.cidade || c.id == dadosOriginais.cidade
                );
                if (cidAtual) $selCid.val(cidAtual.id);

                $tdCid.append($selCid);
            }
            else if (emp.cidades?.length === 1) {
                $tdCid
                    .text(emp.cidades[0].nome)
                    .attr("data-single-field", "cidade")
                    .attr("data-single-id", emp.cidades[0].id);
            }
            else {
                $tdCid
                    .text("—")
                    .attr("data-clear", "cidade");
            }
        }




        // Transforma colunas em campos de texto (exceto chips em Empresa e exceto booleanos)
        lastCols.forEach(async (col, i) => {
            if (col === "id") return;
            // NÃO transformar booleans em input — manter checkbox
            if (["disponivel", "integracao", "liberacao", "seguranca"].includes(col)) return;
            if (entidadeAtual === "Empresa" && (col === "cidades" || col === "supervisores")) return;
            if (entidadeAtual === "Setor" && (col === "cargos")) return;
            // 🔒 BLOQUEIA supervisor e cidade inicialmente (OS)
            if (entidadeAtual === "OS" && (col === "supervisor" || col === "cidade")) {
                // mantém texto e não transforma em input
                return;
            }
            if (entidadeAtual === "OS" && col === "status") {
                const $sel = $linha.find("td").eq(i).find("select");
                if ($sel.length) {
                    // Apenas desabilita temporariamente para evitar interação enquanto edita outras colunas
                    $sel.prop("disabled", true);
                }
                return; // não recria input
            }
            const $td = $linha.find("td").eq(i);
            const valor = dadosOriginais[col];
            let $input;
            if (entidadeAtual === "EPI" && col === "obrigatorio") {
                $input = $("<select>").attr({ "data-field": col, "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    })
                    .append(`<option value="1">Sim</option>`)
                    .append(`<option value="0">Não</option>`);
                $input.val(valor === "SIM" ? "1" : "0");
            } else if (entidadeAtual === "OS" && col === "status") {
                $input = $("<select>")
                    .attr({ "data-field": col, "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    })
                    .append(`
                            <option value="0">⚪ Sem responsável</option>
                            <option value="1">🟠 Aguardando</option>
                            <option value="2">🔵 Em execução</option>
                            <option value="3">🔴 Parado</option>
                            <option value="4">🟢 Concluído</option>
                            <option value="5">🟡 Em espera</option>
                            <option value="6">⚫ Cancelado</option>
                        `);

                // Define valor atual conforme o texto exibido
                const map = {
                    "⚪ Sem responsável": "0",
                    "🟠 Aguardando": "1",
                    "🔵 Em execução": "2",
                    "🔴 Parado": "3",
                    "🟢 Concluído": "4",
                    "🟡 Em espera": "5",
                    "⚫ Cancelado": "6"
                };
                $input.val(map[valor] ?? valor ?? "0");
            } else if (entidadeAtual === "OS" && (col === "criado" || col === "concluido")) {// 🔹 Se for coluna de data (criado / concluido) na aba OS → usa <input type="date">
                // Tenta converter "20/10/2023" para "2023-10-20"
                let valorNormalizado = "";
                if (valor && /^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
                    const [dia, mes, ano] = valor.split("/");
                    valorNormalizado = `${ano}-${mes}-${dia}`;
                } else if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
                    valorNormalizado = valor; // já está correto
                }

                $input = $("<input>")
                    .attr({
                        type: "date",
                        "data-field": col,
                        "data-editing": "true"
                    })
                    .val(valorNormalizado)
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "#3f3f3f",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });
            } else if (entidadeAtual === "OS" && col === "empresa") {
                const empresas = await fetchEmpresas();
                const $sel = $("<select>")
                    .attr({ "data-field": col, "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });

                $sel.append(`<option value="">— selecione —</option>`);
                empresas.forEach(emp => $sel.append(`<option value="${emp.id}">${emp.nome}</option>`));

                // Seleciona empresa atual
                const empresaAtual = empresas.find(e => e.nome === valor || e.id == valor);
                if (empresaAtual) {
                    $sel.val(empresaAtual.id);

                    // 🔹 NOVO: já renderiza supervisor e cidade conforme empresa atual
                    renderDependentesOS($linha, empresaAtual, dadosOriginais);
                }

                // Ao mudar a empresa, atualiza Supervisor e Cidade
                $sel.on("change", async function () {
                    const emp = empresas.find(e => e.id == $(this).val());
                    if (!emp) return;

                    renderDependentesOS($linha, emp, dadosOriginais);

                });

                $input = $sel;
            } else if (entidadeAtual === "OS" && col === "responsavel") {
                const responsaveis = await fetchResponsaveis();
                const $td = $linha.find("td").eq(i);
                const valorAtual = dadosOriginais.responsavel;

                const $sel = $("<select>")
                    .attr({ "data-field": "responsavel", "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });

                $sel.append(`<option value="">— selecione —</option>`);

                responsaveis.forEach(r =>
                    $sel.append(`<option value="${r.id}">${r.nome}</option>`)
                );

                // 🔹 pré-seleciona responsável atual
                const atual = responsaveis.find(
                    r => r.nome === valorAtual || r.id == valorAtual
                );
                if (atual) $sel.val(atual.id);

                $td.empty().append($sel);
                return;
            } else if (entidadeAtual === "OS" && col === "orcado") {
                const $td = $linha.find("td").eq(i);

                // valor vem como "R$ 1.000,00" → converte para número simples
                const valorNum = moedaParaNumero(valor);

                const $input = $("<input>")
                    .attr({
                        type: "text",
                        "data-field": "orcado",
                        "data-editing": "true",
                        placeholder: "0,00"
                    })
                    .val(valorNum != null && !isNaN(valorNum) ? valorNum.toString().replace(".", ",") : "")
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px",
                        textAlign: "right"
                    });

                $td.empty().append($input);
                return; // ⛔ não deixa cair no input genérico
            } else if ((entidadeAtual === "Cargo" && col === "nivel") || (entidadeAtual === "Setor" && col === "nivel")) {
                $input = $("<select>").attr({ "data-field": col, "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    })
                    .append(`<option value="">— selecione —</option>`)
                    .append(`<option value="0">0</option>`)
                    .append(`<option value="1">1</option>`)
                    .append(`<option value="2">2</option>`)
                    .append(`<option value="3">3</option>`)
                    .append(`<option value="4">4</option>`)
                    .append(`<option value="5">5</option>`)
                    .append(`<option value="6">6</option>`)
                    .append(`<option value="7">7</option>`)
                    .append(`<option value="8">8</option>`)
                    .append(`<option value="9">9</option>`);
                $input.val(valor);
            } else {
                $input = $("<input>")
                    .val(valor)
                    .attr({ "data-field": col, "data-editing": "true" })
                    .css({
                        width: "100%",
                        padding: "4px 6px",
                        background: "var(--input-bg)",
                        color: "var(--texto-principal)",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        fontSize: "12px"
                    });
            }

            $td.empty().append($input);
        });

        const $acoes = $linha.find(".col-acoes");
        $acoes.empty();

        const $btnSave = $("<button>").html(`${iconeSalvar}`).addClass("save").attr({ "title": "Salvar" });
        const $btnCancel = $("<button>").html(`${iconeCancelar}`).addClass("cancel").attr({ "title": "Cancelar" });

        $acoes.append($btnSave, $btnCancel);

        // === Ações ===
        $btnCancel.on("click", () => {
            // Restaura todas as células a partir de dadosOriginais
            lastCols.forEach((col, i) => {
                const $td = $linha.find("td").eq(i);
                if (!col) return;
                // Se era checkbox, restaura checked/unchecked
                if (["disponivel", "integracao", "liberacao", "seguranca"].includes(col)) {
                    // encontra checkbox nessa célula (se existir)
                    const $chk = $td.find("input[type='checkbox']");
                    if ($chk.length) {
                        const orig = dadosOriginais[col] === "1";
                        $chk.prop("checked", orig);
                        $chk.prop("disabled", false); // reativa
                    } else {
                        // se por algum motivo não havia checkbox, restaura texto
                        $td.text(dadosOriginais[col]);
                    }
                    return;
                }
                // Reativa o combobox de status se existir
                if (entidadeAtual === "OS") {
                    $linha.find("select[data-field='status']").prop("disabled", false);
                }
                if (entidadeAtual === "OS" && col === "status") return; // 🔹 não mexe no combobox
                if (entidadeAtual === "Empresa" && (col === "cidades" || col === "supervisores")) return;
                if (entidadeAtual === "Setor" && (col === "cargos")) return;
                $td.text(dadosOriginais[col]);
            });

            restaurarBotoesPadrao($acoes, id);
            $linha.removeClass("editing-row"); // ⭐ remove destaque

            // Reativa qualquer checkbox na linha
            $linha.find("input[type='checkbox']").prop("disabled", false);
        });

        $btnSave.on("click", async () => {
            const novo = {};
            $linha.find("select[data-editing='true'], select").each((_, el) => {
                const campo = $(el).data("field") || lastCols[$(el).closest("td").index()];
                novo[campo] = $(el).val();
            });


            $linha.find("[data-editing='true']").each((_, el) => {
                const campo = $(el).data("field");
                let valor = $(el).val();

                // Se for telefone, remove máscara antes de enviar
                if (campo.toLowerCase().includes("telefone") || campo.toLowerCase().includes("celular")) {
                    valor = valor.replace(/\D/g, ""); // mantém só dígitos
                }
                if (campo === "orcado") {
                    valor = moedaParaNumero(valor);
                }
                novo[campo] = valor;
            });
            // 🔹 Validação de datas (apenas para aba OS)
            if (entidadeAtual === "OS") {
                const criado = novo.criado ? new Date(novo.criado) : null;
                const concluido = novo.concluido ? new Date(novo.concluido) : null;

                if (criado && concluido && concluido < criado) {
                    Toast.fire({
                        icon: "error",
                        theme: 'dark',
                        title: "Data de conclusão não pode ser anterior à data de criação!"
                    });
                    return; // interrompe o salvamento
                }
            }

            ["supervisor", "cidade", "cargo"].forEach(campo => {
                const idx = lastCols.indexOf(campo);
                const $td = $linha.find("td").eq(idx);

                // 1️⃣ Se existe select, o valor já foi capturado antes → não faz nada
                if ($td.find("select").length) return;

                // 2️⃣ Caso exista apenas uma opção (texto com ID oculto)
                if ($td.attr("data-single-field") === campo) {
                    const id = $td.attr("data-single-id");
                    novo[campo] = id ? Number(id) : null;
                    return;
                }

                // 3️⃣ Caso não exista nenhuma opção → limpa
                if ($td.attr("data-clear") === campo) {
                    novo[campo] = null;
                }
            });
            try {
                await updateRegistro(entidadeAtual, id, novo);
                Toast.fire({
                    icon: "success",
                    theme: 'dark',
                    title: "Alterações salvas!"
                });
                await carregarTabela();
            } catch (err) {
                console.error(err);
                Toast.fire({
                    icon: "error",
                    theme: 'dark',
                    title: "Falha ao salvar alterações."
                });
            } finally {
                $linha.removeClass("editing-row"); // ⭐ remove destaque após operação
                // Reativa checkboxes (caso a tabela não seja recarregada)
                $linha.find("input[type='checkbox']").prop("disabled", false);
                // Reativa o combobox de status se existir
                if (entidadeAtual === "OS") {
                    $linha.find("select[data-field='status']").prop("disabled", false);
                }
            }

        });
    }

    // ======== Criação inline ========
    async function criarNovoRegistro() {
        if (entidadeAtual === "OS") {
            $('#form_cadOS').empty().load('../html/forms/cadastro_os.html', function (response, status, xhr) {
                if (status === "success") {
                    preencherCbxResponsavel();
                    const $wrap = $('#frm_cadastrarOS');
                    preencherCbxCliente($wrap);

                } else {
                    alert("Erro ao carregar o formulário: " + xhr.status + " " + xhr.statusText);
                }
            });
            return;
        }
        if ($tbody.find("tr.novo-registro").length) {
            Toast.fire({
                icon: "error",
                theme: 'dark',
                title: "Conclua ou cancele o novo registro antes de criar outro"
            });
            return;
        }

        // Usa todas as colunas, inclusive "id"
        const campos = [...lastCols];
        const $tr = $("<tr>").addClass("novo-registro editing-row");

        for (const col of campos) {
            const $td = $("<td>");

            if (col === "id") {
                // Coluna ID fica vazia
                $td.text("—");
            }

            // 🔒 Empresa: bloquear cidades e supervisores
            else if (entidadeAtual === "Empresa" && (col === "cidades" || col === "supervisores")) {
                $td.text("—").attr("title", "Disponível após salvar a Empresa");
            }

            // 🔒 Empresa: bloquear integracao, liberacao e seguranca
            else if (entidadeAtual === "Empresa" && ["integracao", "liberacao", "seguranca"].includes(col)) {
                $td.text("—").attr("title", "Disponível após salvar a Empresa");
            }
            // 🔒 Cargo: bloquear disponivel
            else if (entidadeAtual === "Cargo" && ["disponivel"].includes(col)) {
                $td.text("—").attr("title", "Disponível após salvar o Cargo");
            } else {
                // Campos editáveis
                let $input;
                if (entidadeAtual === "EPI" && col === "obrigatorio") {
                    $input = $("<select>").attr({ "data-field": col, "data-editing": "true" })
                        .css({
                            width: "100%",
                            padding: "4px 6px",
                            background: "var(--input-bg)",
                            color: "var(--texto-principal)",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            fontSize: "12px"
                        })
                        .append(`<option value="">— selecione —</option>`)
                        .append(`<option value="1">Sim</option>`)
                        .append(`<option value="0">Não</option>`);
                } else if ((entidadeAtual === "Cargo" && col === "nivel") || (entidadeAtual === "Setor" && col === "nivel")) {
                    $input = $("<select>").attr({ "data-field": col, "data-editing": "true" })
                        .css({
                            width: "100%",
                            padding: "4px 6px",
                            background: "var(--input-bg)",
                            color: "var(--texto-principal)",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            fontSize: "12px"
                        })
                        .append(`<option value="">— selecione —</option>`)
                        .append(`<option value="0">0</option>`)
                        .append(`<option value="1">1</option>`)
                        .append(`<option value="2">2</option>`)
                        .append(`<option value="3">3</option>`)
                        .append(`<option value="4">4</option>`)
                        .append(`<option value="5">5</option>`)
                        .append(`<option value="6">6</option>`)
                        .append(`<option value="7">7</option>`)
                        .append(`<option value="8">8</option>`)
                        .append(`<option value="9">9</option>`);
                } else {
                    $input = $("<input>")
                        .attr({ "data-field": col, "data-editing": "true", placeholder: col })
                        .css({
                            width: "100%",
                            padding: "4px 6px",
                            background: "var(--input-bg)",
                            color: "var(--texto-principal)",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            fontSize: "12px"
                        });
                }
                $td.append($input);
            }

            $tr.append($td);
        };


        // Coluna de ações
        const $tdAcoes = $("<td>").addClass("col-acoes");
        const $btnSave = $("<button>").addClass("save").html(`${iconeSalvar}`).attr({ "title": "Salvar" });
        const $btnCancel = $("<button>").addClass("cancel").html(`${iconeCancelar}`).attr({ "title": "Cancelar" });
        $tdAcoes.append($btnSave, $btnCancel);
        $tr.append($tdAcoes);

        // Adiciona no topo da tabela
        $tbody.prepend($tr);

        // Foco automático no primeiro campo editável
        $tr.find("input[data-editing='true']").first().trigger("focus");

        // === Ações ===
        $btnCancel.on("click", () => $tr.remove());

        $btnSave.on("click", async () => {
            const novo = {};
            $tr.find("[data-editing='true']").each((_, el) => {
                const campo = $(el).data("field");
                let valor = $(el).val();

                // Se for telefone, remove máscara antes de enviar
                if (campo.toLowerCase().includes("telefone") || campo.toLowerCase().includes("celular")) {
                    valor = valor.replace(/\D/g, ""); // mantém só dígitos
                }

                novo[campo] = valor;
            });


            try {
                await criarRegistro(entidadeAtual, novo);
                Toast.fire({
                    icon: "success",
                    theme: 'dark',
                    title: "Registro criado!"
                });
                await carregarTabela();
            } catch (err) {
                console.error(err);
                Toast.fire({
                    icon: "error",
                    theme: 'dark',
                    title: "Falha ao criar registro."
                });
            }
        });
    }

    // ======== Remover Inline =========
    async function apagar(id) {
        Swal.fire({
            title: "Remover?",
            text: `Deseja realmente remover este registro de ${entidadeAtual}?`,
            icon: "warning",
            theme: "dark",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, remover!"
        }).then((result) => {
            if (result.isConfirmed) {

                removerRegistro(entidadeAtual, id);
            }
        });
    }

    // Restaura os botões padrão (Editar/Apagar)
    function restaurarBotoesPadrao($acoes, id) {
        $acoes.empty();

        const $bEdit = $("<button>").html(`${iconeEditar}`).attr({ "data-action": "editar", "data-id": id, "title": "Editar" });
        const $bDel = $("<button>").html(`${iconeApagar}`).addClass('apagar').attr({ "data-action": "apagar", "data-id": id, "title": "Apagar" });

        $acoes.append($bEdit, $bDel);

    }


    // ========================== BUSCA ==========================
    const debounced = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); } };
    const aplicarFiltro = (texto) => {
        const termo = String(texto).toLowerCase();
        let visiveis = 0;

        $("#tbody tr").each(function () {
            const visible = $(this).text().toLowerCase().includes(termo);
            $(this).toggle(visible);
            if (visible) visiveis++;
        });

        // Atualiza contador dinâmico
        if (entidadeAtual !== "OS") {
            $("#totalCount").text(`Total: ${visiveis}`);
        }
    };
    $searchInput.on("input", debounced(e => aplicarFiltro(e.target.value)));

    // ========================== BOTÕES ==========================
    $btnReload.on("click", carregarTabela);
    $btnNovo.on("click", () => criarNovoRegistro());

    $btnToggleChart.on("click", function () {
        const $chart = $("#osChartContainer");
        const visivel = $chart.is(":visible");

        if (visivel) {
            $chart.slideUp(250);
            $(this).text("📉 Mostrar Gráfico");
        } else {
            $chart.slideDown(250);
            $(this).text("📈 Ocultar Gráfico");
        }
    });


    // ========================== INTEGRAÇÃO (endpoints reais) ==========================
    async function addAssociation(clienteId, kind, relId) {

        const tipo = String(kind).toLowerCase();

        let url;
        let field;

        if (tipo.startsWith("cidade")) {
            url = `${BASE_URL}/empresa/${clienteId}/cidades`;
            field = "cidadeId";
        }
        else if (tipo.startsWith("cargo")) {
            url = `${BASE_URL}/setor/${clienteId}/cargos`;
            field = "idCargo";
        }
        else {
            url = `${BASE_URL}/empresa/${clienteId}/supervisores`;
            field = "supervisorId";
        }

        return $.ajax({
            url,
            method: "POST",
            xhrFields: { withCredentials: true },
            contentType: "application/json",
            data: JSON.stringify({ [field]: relId })
        });
    }


    async function removeAssociation(clienteId, kind, relId) {

        const tipo = String(kind).toLowerCase();

        let url;

        if (tipo.startsWith("cidade")) {
            url = `${BASE_URL}/empresa/${clienteId}/cidades/${relId}`;
        }
        else if (tipo.startsWith("cargo")) {
            url = `${BASE_URL}/setor/${clienteId}/cargos/${relId}`;
        }
        else {
            url = `${BASE_URL}/empresa/${clienteId}/supervisores/${relId}`;
        }

        return $.ajax({
            url,
            method: "DELETE",
            xhrFields: { withCredentials: true }
        });
    }


    async function updateRegistro(entidade, id, payload) {
        const url = `${BASE_URL}/${entidade.toLowerCase()}/editar/${id}`;
        return $.ajax({
            url,
            method: "PUT",
            xhrFields: { withCredentials: true },
            contentType: "application/json",
            data: JSON.stringify(payload)
        });
    }

    async function removerRegistro(entidade, id) {
        try {
            const url = `${BASE_URL}/${entidade.toLowerCase()}/excluir/${id}`;
            const response = await $.ajax({
                url,
                method: "DELETE",
                xhrFields: { withCredentials: true },
                contentType: "application/json"
            });
            Toast.fire({
                icon: "success",
                theme: 'dark',
                title: "Registro removido!"
            });
            await carregarTabela();
            return response;

        } catch (erro) {
            console.error("Erro ao remover registro:", erro);
            Toast.fire({
                icon: "error",
                theme: 'dark',
                title: "Falha ao remover o registro."
            });
        }
    }

    async function criarRegistro(entidade, payload) {
        try {
            if (!entidade || typeof entidade !== "string") {
                throw new Error("Entidade inválida: o parâmetro 'entidade' deve ser uma string.");
            }

            if (!payload || typeof payload !== "object") {
                throw new Error("Payload inválido: o parâmetro 'payload' deve ser um objeto.");
            }

            const entidadeLower = entidade.toLowerCase();
            const url = `${BASE_URL}/${entidadeLower}/cadastrar`;

            const response = await $.ajax({
                url,
                method: "POST",
                xhrFields: { withCredentials: true },
                contentType: "application/json",
                data: JSON.stringify(payload)
            });

            return {
                sucesso: true,
                dados: response
            };
        } catch (erro) {
            console.error("Erro ao criar registro:", erro);

            let mensagemErro = "Erro desconhecido ao criar o registro.";

            if (erro.responseJSON && erro.responseJSON.message) {
                mensagemErro = erro.responseJSON.message;
            } else if (erro.statusText) {
                mensagemErro = `${erro.status} - ${erro.statusText}`;
            } else if (erro.message) {
                mensagemErro = erro.message;
            }

            return {
                sucesso: false,
                erro: mensagemErro
            };
        }
    }


    async function fetchCidades() {
        try {
            const arr = await $.ajax({
                url: `${BASE_URL}/cidade`,
                method: "GET",
                xhrFields: { withCredentials: true }
            });
            return (Array.isArray(arr) ? arr : []).map(c => ({
                id: c.id_cidades ?? null,
                nome: c.nome ?? ""
            }));
        } catch (e) {
            console.warn("Fallback cidades (mock):", e);
            return [
                { id: 1, nome: "Santa Cruz do Sul" },
                { id: 2, nome: "Rio Pardo" },
                { id: 3, nome: "Porto Alegre" }
            ];
        }
    }

    async function fetchSupervisores() {
        try {
            const arr = await $.ajax({
                url: `${BASE_URL}/supervisor`,
                method: "GET",
                xhrFields: { withCredentials: true }
            });
            return (Array.isArray(arr) ? arr : []).map(s => ({
                id: s.id_supervisores ?? s.id_supervisor ?? s.id ?? null,
                nome: s.nome ?? s.name ?? ""
            }));
        } catch (e) {
            console.warn("Fallback supervisores (mock):", e);
            return [
                { id: 10, nome: "João da Silva" },
                { id: 11, nome: "Maria Santos" }
            ];
        }
    }


    async function fetchCargos() {
        try {
            const arr = await $.ajax({
                url: `${BASE_URL}/cargo`,
                method: "GET",
                xhrFields: { withCredentials: true }
            });
            return (Array.isArray(arr) ? arr : []).map(c => ({
                id: c.id ?? null,
                nome: c.nome ?? ""
            }));
        } catch (e) {
            console.warn("Fallback cidades (mock):", e);
            return [
                { id: 1, nome: "Teste 1" },
                { id: 2, nome: "Teste 2" }
            ];
        }
    }

    async function fetchEmpresas() {
        try {
            const arr = await $.ajax({
                url: `${BASE_URL}/empresa`,
                method: "GET",
                xhrFields: { withCredentials: true }
            });

            // Garante array
            const empresas = Array.isArray(arr) ? arr : (arr?.data ?? []);

            return empresas.map(e => {
                // Faz parse seguro de cidades/supervisores JSON
                const parseJSON = (str) => {
                    try {
                        const val = JSON.parse(str);
                        return Array.isArray(val) ? val : [];
                    } catch {
                        return [];
                    }
                };

                return {
                    id: e.id ?? e.id_empresas ?? null,
                    nome: e.nome ?? e.razao_social ?? "",
                    integracao: e.integracao ?? 0,
                    liberacao: e.liberacao ?? 0,
                    seguranca: e.seguranca ?? 0,
                    cidades: parseJSON(e.cidades),
                    supervisores: parseJSON(e.supervisores)
                };
            });

        } catch (e) {
            console.error("⚠️ Erro em fetchEmpresas:", e);
            // fallback mínimo
            return [
                {
                    id: 1,
                    nome: "ACME LTDA",
                    cidades: [{ id: 1, nome: "Santa Cruz" }],
                    supervisores: [{ id: 10, nome: "João" }]
                }
            ];
        }
    }

    async function fetchResponsaveis() {
        try {
            const arr = await $.ajax({
                url: "/api/colaboradores/responsavel/cbx",
                method: "GET",
                xhrFields: { withCredentials: true }
            });

            return (Array.isArray(arr) ? arr : []).map(r => ({
                id: r.id ?? r.id_responsavel ?? null,
                nome: r.nome ?? r.name ?? ""
            }));
        } catch (e) {
            console.error("Erro ao buscar responsáveis:", e);
            return [];
        }
    }

    async function fetchSetores() {
        try {
            const arr = await $.ajax({
                url: "/api/setor",
                method: "GET",
                xhrFields: { withCredentials: true }
            });

            return (Array.isArray(arr) ? arr : []).map(s => ({
                id: s.id_catnvl,
                nome: s.categoria ?? ""
            }));
        } catch (e) {
            console.error("Erro ao buscar setores:", e);
            return [];
        }
    }



    // ========================== DADOS FAKE (listagem) ==========================
    function getDadosFake(tipo) {
        switch (tipo) {
            case "EPI": return [
                { id: 1, nome: "Capacete", validade: "12 meses" },
                { id: 2, nome: "Luvas", validade: "6 meses" }
            ];
            case "Exame": return [
                { id: 1, nome: "Audiometria", validade: "1 ano" },
                { id: 2, nome: "Acuidade Visual", validade: "2 anos" }
            ];
            case "Curso": return [
                { id: 1, nome: "NR10", validade: "2 anos" },
                { id: 2, nome: "NR35", validade: "2 anos" }
            ];
            case "Empresa": return [
                { id: 1, nome: "ACME LTDA", cidades: [{ id: 1, nome: "Santa Cruz do Sul" }], supervisores: [{ id: 10, nome: "João da Silva" }] },
                { id: 2, nome: "Philip Morris", cidades: [{ id: 2, nome: "Rio Pardo" }, { id: 3, nome: "Porto Alegre" }], supervisores: [{ id: 11, nome: "Maria Santos" }] }
            ];
            case "Supervisor": return [
                { id: 1, nome: "João da Silva", email: "joao@empresa.com" },
                { id: 2, nome: "Maria Santos", email: "maria@empresa.com" }
            ];
            case "Cidade": return [
                { id: 1, nome: "Santa Cruz do Sul", estado: "RS" },
                { id: 2, nome: "Rio Pardo", estado: "RS" }
            ];
            default: return [];
        }
    }

    // ========================== INIT ==========================
    carregarTabela();

    function atualizarCardsResumo() {
        if (entidadeAtual !== "OS") return;
        const $resumo = $("#resumo");
        if (!$resumo.length) return;

        const normalizar = s => String(s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, "")
            .trim();

        const total = dados.length;
        const sem = dados.filter(d => normalizar(d.status).includes("sem responsavel")).length;
        const agu = dados.filter(d => normalizar(d.status).includes("aguardando")).length;
        const exe = dados.filter(d => normalizar(d.status).includes("em execucao")).length;
        const par = dados.filter(d => normalizar(d.status).includes("parado")).length;
        const con = dados.filter(d => normalizar(d.status).includes("concluido")).length;
        const esp = dados.filter(d => normalizar(d.status).includes("em espera")).length;
        const can = dados.filter(d => normalizar(d.status).includes("cancelado")).length;

        const cardsHTML = `
        <div class="card-resumo tot"><h3>Total</h3><p>${total}</p></div>
        <div class="card-resumo sem"><h3>Sem Resp.</h3><p>${sem}</p></div>
        <div class="card-resumo agu"><h3>Aguardando</h3><p>${agu}</p></div>
        <div class="card-resumo exe"><h3>Execução</h3><p>${exe}</p></div>
        <div class="card-resumo par"><h3>Parado</h3><p>${par}</p></div>
        <div class="card-resumo con"><h3>Concluído</h3><p>${con}</p></div>
        <div class="card-resumo esp"><h3>Em Espera</h3><p>${esp}</p></div>
        <div class="card-resumo can"><h3>Cancelado</h3><p>${can}</p></div>
    `;
        $resumo.html(cardsHTML).show();
    }

    // ======== GRÁFICO DE TIMELINE DE OS ========
    function atualizarGraficoOS() {
        if (entidadeAtual !== "OS") {
            $("#osChartContainer").hide();
            return;
        }

        const $chartContainer = $("#osChartContainer");
        const ctx = document.getElementById("osTimelineChart");
        if (!ctx) return;

        // 🔹 Monta os últimos 12 meses até o atual
        const hoje = new Date();
        const mesesLabels = [];
        const mesesRef = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const ano = d.getFullYear();
            const mes = d.getMonth();
            const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            mesesLabels.push(`${nomes[mes]}/${ano}`);
            mesesRef.push({ ano, mes: mes + 1 });
        }

        const iniciadas = Array(12).fill(0);
        const concluidas = Array(12).fill(0);

        // 🔹 Alimenta os dados conforme os campos "criado" e "concluido"
        dados.forEach(os => {
            const addContagem = (dataStr, arr) => {
                if (!dataStr) return;
                const [yStr, mStr] = String(dataStr).split("-");
                const ano = parseInt(yStr);
                const mes = parseInt(mStr);
                if (isNaN(ano) || isNaN(mes)) return;
                const idx = mesesRef.findIndex(r => r.ano === ano && r.mes === mes);
                if (idx >= 0) arr[idx]++;
            };
            addContagem(os.criado, iniciadas);
            addContagem(os.concluido, concluidas);
        });

        // 🔹 Taxa de Conclusão Mensal (concluídas / criadas)
        const taxaMensal = iniciadas.map((criadasMes, i) => {
            const concluidasMes = concluidas[i];
            const t = criadasMes > 0 ? (concluidasMes / criadasMes) * 100 : 0;
            return Number(t.toFixed(1));
        });

        // 🔹 Taxa acumulada — eficiência global até o mês
        let acumCriadas = 0;
        let acumConcluidas = 0;
        const taxaAcumulada = iniciadas.map((v, i) => {
            acumCriadas += v;
            acumConcluidas += concluidas[i];
            const t = acumCriadas > 0 ? (acumConcluidas / acumCriadas) * 100 : 0;
            return Number(t.toFixed(1));
        });

        // 🔹 Limpa gráfico anterior, se houver
        if (window._graficoOS) window._graficoOS.destroy();

        const idxMesAtual = 11;
        const linhaAmarela = "rgba(250, 204, 21, 0.85)";
        const linhaBranca = "rgba(255, 255, 255, 0.9)";
        const fundoMesAtual = "rgba(56, 189, 248, 0.08)";

        // 🔹 Plugin de destaque do mês atual
        const highlightPlugin = {
            id: "highlightMonth",
            beforeDraw(chart) {
                if (!chart.chartArea) return;
                const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
                const tickWidth = (x.getPixelForTick(1) - x.getPixelForTick(0)) || 0;
                const xStart = x.getPixelForTick(idxMesAtual) - tickWidth / 2;
                const xEnd = x.getPixelForTick(idxMesAtual) + tickWidth / 2;
                ctx.save();
                ctx.fillStyle = fundoMesAtual;
                ctx.fillRect(xStart, top, xEnd - xStart, bottom - top);
                ctx.restore();
            }
        };

        // 🔹 Cria o gráfico
        window._graficoOS = new Chart(ctx, {
            type: "bar",
            data: {
                labels: mesesLabels,
                datasets: [
                    {
                        label: "OS Criadas",
                        data: iniciadas,
                        backgroundColor: "rgba(59,130,246,0.6)",
                        borderColor: "#3b82f6",
                        borderWidth: 1
                    },
                    {
                        label: "OS Concluídas",
                        data: concluidas,
                        backgroundColor: "rgba(34,197,94,0.6)",
                        borderColor: "#22c55e",
                        borderWidth: 1
                    },
                    {
                        label: "Taxa de Conclusão Mensal (%)",
                        data: taxaMensal,
                        type: "line",
                        yAxisID: "y1",
                        borderColor: linhaAmarela,
                        borderWidth: 2,
                        borderDash: [6, 4],
                        tension: 0.35,
                        fill: false,
                        pointRadius: 4,
                        pointBackgroundColor: linhaAmarela,
                        pointBorderColor: linhaAmarela
                    },
                    {
                        label: "Taxa de Conclusão Acumulada (%)",
                        data: taxaAcumulada,
                        type: "line",
                        yAxisID: "y1",
                        borderColor: linhaBranca,
                        borderWidth: 2,
                        tension: 0.35,
                        fill: false,
                        pointRadius: 3,
                        pointBackgroundColor: linhaBranca,
                        pointBorderColor: linhaBranca
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Quantidade" },
                        grid: { color: "rgba(255,255,255,0.1)" }
                    },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        suggestedMax: 120, // começa sugerindo 120%, mas autoajusta se maior
                        title: { display: true, text: "Taxa de Conclusão (%)" },
                        grid: { drawOnChartArea: false }
                    },

                    x: {
                        grid: {
                            color: "rgba(255,255,255,0.08)",
                            lineWidth: (ctx) => (ctx.index === idxMesAtual ? 2 : 1)
                        },
                        ticks: { color: "#e7ebf6" }
                    }
                },
                plugins: {
                    legend: { position: "bottom", labels: { color: "#e7ebf6" } },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                const i = context.dataIndex;
                                if (context.dataset.label.includes("Mensal")) {
                                    return `Taxa mensal: ${context.formattedValue}%`;
                                } else if (context.dataset.label.includes("Acumulada")) {
                                    return `Taxa acumulada: ${context.formattedValue}%`;
                                } else {
                                    return `${context.dataset.label}: ${context.formattedValue}`;
                                }
                            }
                        }
                    }
                },
                animation: false
            },
            plugins: [highlightPlugin]
        });
        // ========================== GRÁFICO EM PIZZA (OS POR RESPONSÁVEL) ==========================
        const ctxPie = document.getElementById("osPieChart");
        if (ctxPie) {
            // Agrupa total de OSs por responsável
            const porResp = {};
            dados.forEach(os => {
                const resp = os.responsavel || "Sem responsável";
                porResp[resp] = (porResp[resp] || 0) + 1;
            });

            const labelsResp = Object.keys(porResp);
            const valoresResp = Object.values(porResp);

            // Paleta de cores translúcidas e suaves
            const cores = [
                "rgba(59,130,246,0.50)",  // azul
                "rgba(34,197,94,0.50)",   // verde
                "rgba(239,68,68,0.50)",   // vermelho
                "rgba(250,204,21,0.50)",  // amarelo
                "rgba(168,85,247,0.50)",  // roxo
                "rgba(6,182,212,0.50)",   // ciano
                "rgba(249,115,22,0.50)",  // laranja
                "rgba(132,204,22,0.50)",  // lima
                "rgba(99,102,241,0.50)",  // índigo
                "rgba(244,63,94,0.50)"    // rosa
            ];
            const corUsadas = labelsResp.map((_, i) => cores[i % cores.length]);

            // Remove gráfico anterior, se existir
            if (window._graficoPieOS) window._graficoPieOS.destroy();

            // Cria o novo gráfico pizza
            window._graficoPieOS = new Chart(ctxPie, {
                type: "pie",
                data: {
                    labels: labelsResp,
                    datasets: [{
                        data: valoresResp,
                        backgroundColor: corUsadas,
                        borderWidth: 0
                    }]
                },
                options: {
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: "OS por Responsável",
                            color: "#e7ebf6",
                            font: {
                                size: 11,
                                weight: "500"
                            },
                            padding: {
                                top: 4,
                                bottom: 4
                            }
                        },
                        tooltip: {
                            backgroundColor: "rgba(20,20,20,0.9)",
                            titleColor: "#e7ebf6",
                            bodyColor: "#cfd3e0",
                            titleFont: { size: 10, weight: "500" },
                            bodyFont: { size: 10 },
                            padding: 6,
                            cornerRadius: 4,
                            callbacks: {
                                label: (context) => {
                                    const total = valoresResp.reduce((a, b) => a + b, 0);
                                    const val = context.parsed;
                                    const pct = ((val / total) * 100).toFixed(1);
                                    return `Total OS: ${val} (${pct}%)`;
                                }
                            }
                        }
                    },
                    layout: {
                        padding: { top: 10, bottom: 0 }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }





        $chartContainer.hide();
        $("#btnToggleChart").text("📉 Mostrar Gráfico");
    }


    function renderLinhasTabela() {
        $tbody.empty();
        const $fragBody = $(document.createDocumentFragment());

        dados.forEach(item => {
            const $tr = $("<tr>");

            lastCols.forEach(c => {
                const $td = $("<td>");

                // ======== Coluna de status (OS) ========
                if (entidadeAtual === "OS" && c === "status") {
                    const map = {
                        0: "⚪ Sem responsável",
                        1: "🟠 Aguardando",
                        2: "🔵 Em execução",
                        3: "🔴 Parado",
                        4: "🟢 Concluído",
                        5: "🟡 Em espera",
                        6: "⚫ Cancelado"
                    };
                    const $sel = $("<select>")
                        .css({
                            background: "var(--input-bg)",
                            color: "var(--texto-principal)",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            fontSize: "12px",
                            padding: "4px 6px",
                            width: "100%"
                        })
                        .attr({
                            "data-id": item.id,
                            "data-entity": entidadeAtual,
                            "data-field": "status"
                        });

                    Object.entries(map).forEach(([val, label]) => {
                        $sel.append($("<option>").val(val).text(label));
                    });

                    const current = Object.entries(map).find(([_, lbl]) => lbl === item.status)?.[0] ?? "0";
                    $sel.val(current);

                    // 🔁 Atualiza backend e cards ao mudar
                    $sel.on("change", async function () {
                        const novoValor = $(this).val();
                        const id = $(this).data("id");
                        try {
                            await updateRegistro("OS", id, { status: novoValor });
                            const item = dados.find(d => d.id === id);
                            if (item) item.status = map[novoValor] ?? item.status;
                            atualizarCardsResumo();
                            atualizarGraficoOS(); // 🔹 atualiza o gráfico
                            Toast.fire({ icon: "success", theme: 'dark', title: "Status atualizado!" });
                        } catch (err) {
                            Toast.fire({ icon: "error", theme: 'dark', title: "Falha ao atualizar status." });
                        }
                    });

                    $td.append($sel);
                }

                // ======== Colunas booleanas (checkbox Empresa) ========
                else if (entidadeAtual === "Empresa" && ["integracao", "liberacao", "seguranca"].includes(c)) {
                    const $chk = $("<input>").attr({
                        type: "checkbox",
                        "data-id": item.id,
                        "data-field": c,
                        "data-entity": entidadeAtual
                    }).prop("checked", item[c] == 1);

                    $chk.on("change", async function () {
                        const id = $(this).data("id");
                        const field = $(this).data("field");
                        const valor = $(this).is(":checked") ? 1 : 0;
                        try {
                            await updateRegistro(entidadeAtual, id, { [field]: valor });
                            Toast.fire({ icon: "success", theme: 'dark', title: `${field} atualizado!` });
                        } catch {
                            Toast.fire({ icon: "error", theme: 'dark', title: `Falha ao atualizar ${field}` });
                        }
                    });

                    $td.append($chk);
                }

                // ======== Colunas booleanas (checkbox Empresa) ========
                else if (entidadeAtual === "Cargo" && ["disponivel"].includes(c)) {
                    const $chk = $("<input>").attr({
                        type: "checkbox",
                        "data-id": item.id,
                        "data-field": c,
                        "data-entity": entidadeAtual
                    }).prop("checked", item[c] == 1);

                    $chk.on("change", async function () {
                        const id = $(this).data("id");
                        const field = $(this).data("field");
                        const valor = $(this).is(":checked") ? 1 : 0;
                        try {
                            await updateRegistro(entidadeAtual, id, { [field]: valor });
                            Toast.fire({ icon: "success", theme: 'dark', title: `${field} atualizado!` });
                        } catch {
                            Toast.fire({ icon: "error", theme: 'dark', title: `Falha ao atualizar ${field}` });
                        }
                    });

                    $td.append($chk);
                }



                // ======== Chips (Empresa) ========
                else if (entidadeAtual === "Empresa" && (c === "cidades" || c === "supervisores")) {
                    renderChipsCell($td, item, c);
                }

                else if (entidadeAtual === "Setor" && (c === "cargos")) {
                    renderChipsCell($td, item, c);
                }


                // ======== Texto padrão ========
                else if (entidadeAtual === "OS" && c === "orcado") {
                    $td.text(formatarMoedaBR(item[c]));
                }

                else {
                    $td.text(formatCell(item[c], c));
                }

                $tr.append($td);
            });

            // ======== Coluna Ações ========
            const $tdAcoes = $("<td>").addClass("col-acoes");
            const $bEdit = $("<button>").html(`${iconeEditar}`).attr({ "data-action": "editar", "data-id": item.id, "title": "Editar" });
            const $bDel = $("<button>").html(`${iconeApagar}`).addClass('apagar').attr({ "data-action": "apagar", "data-id": item.id, "title": "Apagar" });
            $tdAcoes.append($bEdit, $bDel);
            $tr.append($tdAcoes);

            $fragBody.append($tr);
        });

        $tbody.append($fragBody);
    }

    function formatarMoedaBR(valor) {
        if (valor == null || valor === "") return "";
        const num = Number(valor);
        if (isNaN(num)) return valor;

        return num.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function moedaParaNumero(valor) {
        if (valor == null || valor === "") return null;

        // remove R$, espaços e pontos de milhar
        if (typeof valor === "string") {
            valor = valor
                .replace(/[R$\s]/g, "")
                .replace(/\./g, "")
                .replace(",", ".");
        }

        const num = Number(valor);
        return isNaN(num) ? null : num;
    }

    function habilitarResizeColunasEmpresa() {
        const table = document.getElementById("dataTable");
        if (!table) return;

        const ths = table.querySelectorAll("thead th");

        // Cidades (3) e Supervisores (4)
        [2, 3].forEach(idx => {
            const th = ths[idx];
            if (!th || th.classList.contains("resizable")) return;

            th.classList.add("resizable");

            let startX, startWidth;

            th.addEventListener("mousedown", e => {
                // só permite arrastar se estiver próximo da borda direita
                if (e.offsetX < th.offsetWidth - 8) return;

                startX = e.pageX;
                startWidth = th.offsetWidth;

                document.body.classList.add("resizing");

                const onMouseMove = eMove => {
                    const newWidth = startWidth + (eMove.pageX - startX);
                    if (newWidth > 120) {
                        th.style.width = newWidth + "px";
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    document.body.classList.remove("resizing");
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
        });
    }



}



