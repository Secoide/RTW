const FeriasModel = require('../models/ferias.model');
const connection = require('../config/db');

/* =====================================================
   CONSTANTES
===================================================== */
const DIAS_CICLO = 30;
const DIAS_PADRAO_SUGESTAO = 15;
const INTERVALO_MIN_MESES = 5;

/* =====================================================
   UTIL – DATA ADMISSÃO
===================================================== */
async function listarAdmissoes() {
    const [rows] = await connection.query(`
        SELECT
            f.id AS idfuncionario,
            COALESCE(f.data_experiencia, adm.data_admissao) AS data_admissao
        FROM funcionarios f
        LEFT JOIN (
            SELECT
                fce.idfuncionario,
                MIN(fce.data) AS data_admissao
            FROM funcionarios_contem_exames fce
            INNER JOIN exames e ON e.idexame = fce.idexame
            WHERE LOWER(e.nome) = 'admissional'
            GROUP BY fce.idfuncionario
        ) adm ON adm.idfuncionario = f.id
        WHERE COALESCE(f.data_experiencia, adm.data_admissao) IS NOT NULL
    `);

    const map = {};
    rows.forEach(r => {
        map[r.idfuncionario] = new Date(r.data_admissao);
    });

    return map;
}

/* =====================================================
   UTIL – DATAS
===================================================== */
function addDias(data, qtd) {
    const d = new Date(data);
    d.setDate(d.getDate() + qtd);
    return d;
}

function normalizarDataISO(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
        if (Number.isNaN(valor.getTime())) return null;
        return [
            valor.getFullYear(),
            String(valor.getMonth() + 1).padStart(2, '0'),
            String(valor.getDate()).padStart(2, '0')
        ].join('-');
    }

    const texto = String(valor).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;

    const data = new Date(`${texto}T00:00:00`);
    return Number.isNaN(data.getTime()) ? null : texto;
}

function criarDataLocal(valor) {
    const iso = normalizarDataISO(valor);
    if (!iso) return null;

    const [ano, mes, dia] = iso.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
}

function calcularDiasPeriodo(inicio, fim) {
    return Math.round((fim - inicio) / 86400000) + 1;
}

function addMeses(data, qtd) {
    const d = new Date(data);
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + qtd);
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimoDia));
    return d;
}

function proximaSegunda(data) {
    const d = new Date(data);
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() + 1);
    }
    return d;
}

/* =====================================================
   CICLOS POR ANIVERSARIO DE ADMISSAO
===================================================== */
function montarCiclosAdquiridos(dataAdmissao, hoje = new Date()) {
    const ciclos = [];
    let inicio = criarDataLocal(dataAdmissao);
    const ref = criarDataLocal(hoje);

    for (let i = 0; i < 80; i++) {
        const aquisitivoInicio = new Date(inicio);
        const aquisitivoFim = new Date(aquisitivoInicio);
        aquisitivoFim.setFullYear(aquisitivoFim.getFullYear() + 1);
        aquisitivoFim.setDate(aquisitivoFim.getDate() - 1);

        const concessivoInicio = addDias(aquisitivoFim, 1);
        const concessivoFim = new Date(concessivoInicio);
        concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);
        concessivoFim.setDate(concessivoFim.getDate() - 1);

        if (concessivoInicio > ref) break;

        ciclos.push({
            id: `ciclo-${i + 1}`,
            aquisitivoInicio,
            aquisitivoFim,
            concessivoInicio,
            concessivoFim,
            diasUsados: 0,
            quantidadePeriodos: 0,
            ferias: []
        });

        inicio.setFullYear(inicio.getFullYear() + 1);
    }

    return ciclos;
}

function atribuirFeriasAosCiclos(ciclos, ferias) {
    const feriasOrdenadas = ferias
        .filter(f => !['sugerida', 'reprovado'].includes(f.status))
        .sort((a, b) => criarDataLocal(a.inicio) - criarDataLocal(b.inicio));

    feriasOrdenadas.forEach(f => {
        const dias = calcularDiasPeriodo(criarDataLocal(f.inicio), criarDataLocal(f.fim));
        const inicioFerias = criarDataLocal(f.inicio);

        const ciclo = ciclos.find(c =>
            c.diasUsados < DIAS_CICLO &&
            inicioFerias >= c.concessivoInicio
        ) || ciclos.find(c => c.diasUsados < DIAS_CICLO);

        if (!ciclo) return;

        ciclo.ferias.push(f);
        ciclo.diasUsados += dias;
        ciclo.quantidadePeriodos++;

        f.cicloId = ciclo.id;
    });

    ciclos.forEach(ciclo => {
        const cicloFront = montarCicloFront(ciclo, false);
        ciclo.ferias.forEach(f => {
            f.ciclo = cicloFront;
        });
    });
}

function montarCicloFront(ciclo, cicloAtual = false) {
    const diasUsados = Math.min(DIAS_CICLO, ciclo.diasUsados);
    const diasRestantes = Math.max(0, DIAS_CICLO - diasUsados);
    const ultimaFerias = ciclo.ferias[ciclo.ferias.length - 1] || null;

    return {
        id: ciclo.id,
        aquisitivoInicio: ciclo.aquisitivoInicio,
        aquisitivoFim: ciclo.aquisitivoFim,
        concessivoInicio: ciclo.concessivoInicio,
        concessivoFim: ciclo.concessivoFim,
        saldo: {
            diasUsados,
            diasRestantes,
            quantidadePeriodos: ciclo.quantidadePeriodos,
            podeCriarNovoPeriodo: ciclo.quantidadePeriodos < 3 && diasRestantes > 0
        },
        cicloAtual,
        cicloEncerradoEm: diasRestantes === 0 && ultimaFerias ? ultimaFerias.fim : null,
        ultimaFeriasFim: ultimaFerias ? ultimaFerias.fim : null
    };
}

/* =====================================================
   LISTAR FÉRIAS (FRONT READY)
===================================================== */
async function listarFerias(inicioFiltro = null, fimFiltro = null) {

    const [feriasRows, colaboradoresBase, admissoes] = await Promise.all([
        FeriasModel.listarFerias(),
        FeriasModel.listarColaboradoresBase(),
        listarAdmissoes()
    ]);

    const mapa = {};

    /* ===============================
       MONTA MAPA DE COLABORADORES
    ============================== */
    colaboradoresBase.forEach(row => {
        mapa[row.id] = {
            id: row.id,
            nome: row.nome,
            fotoperfil: row.fotoperfil,
            versao_foto: row.versao_foto,
            ferias: []
        };
    });

    feriasRows.forEach(row => {
        if (!mapa[row.id_func]) return;
        mapa[row.id_func].ferias.push({
            id: row.id,
            inicio: new Date(row.datainicio),
            fim: new Date(row.datafinal),
            status: row.status || 'avaliar',
            descricao: row.descricao || ''
        });
    });

    /* ===============================
       PROCESSA CADA COLABORADOR
    ============================== */
    Object.values(mapa).forEach(colab => {

        const dataAdm = admissoes[colab.id];
        if (!dataAdm) {
            colab.ciclos = [];
            return;
        }

        // remove sugestões antigas
        colab.ferias = colab.ferias.filter(f => f.status !== 'sugerida');

        /* ===============================
           LIMITES CLT (sempre por admissão)
        ============================== */
        const hoje = new Date();
        const ciclos = montarCiclosAdquiridos(dataAdm, hoje);

        if (!ciclos.length) {
            colab.ciclos = [];
            return;
        }

        atribuirFeriasAosCiclos(ciclos, colab.ferias);
        const cicloAtivo = ciclos.find(c => c.diasUsados < DIAS_CICLO) || ciclos[ciclos.length - 1];
        const cicloFront = montarCicloFront(cicloAtivo, true);
        const saldoAtual = cicloFront.saldo;
        colab.ciclos = [cicloFront];

        /* ===============================
           SUGESTAO AUTOMATICA
        ============================== */
        if ((saldoAtual.diasRestantes <= 0) || (hoje < cicloAtivo.concessivoInicio)) return;
        let baseData = cicloFront.ultimaFeriasFim || cicloAtivo.concessivoInicio;

        let inicioSug = addMeses(baseData, INTERVALO_MIN_MESES);

        if (inicioSug < hoje) inicioSug = hoje;

        inicioSug = proximaSegunda(inicioSug);

        const fimSug = addDias(inicioSug, saldoAtual.diasRestantes - 1);

        colab.ferias.push({
            id: `sug-${colab.id}-${inicioSug.getTime()}`,
            inicio: inicioSug,
            fim: fimSug,
            status: 'sugerida',
            tipo: 'sugerida',
            cicloId: cicloAtivo.id,
            ciclo: cicloFront
        });
    });

    const inicioVisivel = inicioFiltro ? criarDataLocal(inicioFiltro) : null;
    const fimVisivel = fimFiltro ? criarDataLocal(fimFiltro) : null;

    return Object.values(mapa)
        .map(colab => {
            if (!inicioVisivel || !fimVisivel) return colab;

            return {
                ...colab,
                ferias: colab.ferias.filter(f => f.inicio <= fimVisivel && f.fim >= inicioVisivel)
            };
        })
        .filter(colab => !inicioVisivel || !fimVisivel || colab.ferias.length > 0);
}


async function validarFerias(payload, idIgnorado = null) {
    const idFunc = Number(payload.id_func);
    const dataInicioISO = normalizarDataISO(payload.data_inicio || payload.datainicio);
    const dataFimISO = normalizarDataISO(payload.data_fim || payload.datafinal);

    if (!Number.isFinite(idFunc) || idFunc <= 0) {
        const err = new Error('Colaborador invalido.');
        err.statusCode = 400;
        throw err;
    }

    if (!dataInicioISO || !dataFimISO) {
        const err = new Error('Data inicial e final sao obrigatorias.');
        err.statusCode = 400;
        throw err;
    }

    const inicio = criarDataLocal(dataInicioISO);
    const fim = criarDataLocal(dataFimISO);

    if (fim < inicio) {
        const err = new Error('Data final nao pode ser menor que a data inicial.');
        err.statusCode = 400;
        throw err;
    }

    const dias = calcularDiasPeriodo(inicio, fim);
    if (dias < 1 || dias > DIAS_CICLO) {
        const err = new Error('Periodo de ferias deve ter entre 1 e 30 dias.');
        err.statusCode = 400;
        throw err;
    }

    if (!(await FeriasModel.existeColaborador(idFunc))) {
        const err = new Error('Colaborador nao encontrado.');
        err.statusCode = 404;
        throw err;
    }

    const feriasExistentes = await FeriasModel.listarFeriasColaborador(idFunc, idIgnorado);
    const sobrepoe = feriasExistentes.some((f) => {
        const existenteInicio = criarDataLocal(f.datainicio);
        const existenteFim = criarDataLocal(f.datafinal);
        return inicio <= existenteFim && fim >= existenteInicio;
    });

    if (sobrepoe) {
        const err = new Error('Ja existe ferias cadastrada nesse periodo para o colaborador.');
        err.statusCode = 409;
        throw err;
    }

    const diasUsadosNoAno = feriasExistentes.reduce((total, f) => {
        const existenteInicio = criarDataLocal(f.datainicio);
        if (existenteInicio.getFullYear() !== inicio.getFullYear()) return total;
        return total + calcularDiasPeriodo(existenteInicio, criarDataLocal(f.datafinal));
    }, 0);

    if (diasUsadosNoAno + dias > DIAS_CICLO) {
        const err = new Error('O colaborador excederia 30 dias de ferias nesse ciclo/ano.');
        err.statusCode = 400;
        throw err;
    }

    return {
        id_func: idFunc,
        data_inicio: dataInicioISO,
        data_fim: dataFimISO
    };
}





/* =====================================================
   CRUD
===================================================== */
async function criarFerias(payload) {
    const { status } = payload;
    const dados = await validarFerias(payload);

    return FeriasModel.criarFerias({
        datainicio: dados.data_inicio,
        datafinal: dados.data_fim,
        id_func: dados.id_func,
        status: status || 'avaliar'
    });
}

async function atualizarFerias(idFerias, payload) {
    const existente = await FeriasModel.buscarFeriasPorId(idFerias);
    if (!existente) return false;

    const dados = await validarFerias({
        ...payload,
        id_func: existente.id_func
    }, idFerias);

    return FeriasModel.atualizarFerias(idFerias, {
        datainicio: dados.data_inicio,
        datafinal: dados.data_fim,
        descricao: payload.descricao || ''
    });
}

async function atualizarStatus(idFerias, status) {
    const existente = await FeriasModel.buscarFeriasPorId(idFerias);
    if (!existente) return false;

    return FeriasModel.atualizarStatus(idFerias, status);
}

async function excluirFerias(id) {
    return FeriasModel.excluirFerias(id);
}

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
    listarFerias,
    criarFerias,
    atualizarFerias,
    atualizarStatus,
    excluirFerias
};
