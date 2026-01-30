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
            idfuncionario,
            MIN(data) AS data_admissao
        FROM funcionarios_contem_exames
        WHERE idexame = 1
        GROUP BY idfuncionario
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
   GERAR CICLOS PELO GOZO REAL
===================================================== */
function gerarCiclosPorGozo(dataAdmissao, ferias) {

    const feriasOrdenadas = ferias
        .filter(f => f.status !== 'sugerida')
        .sort((a, b) => a.inicio - b.inicio);

    const ciclos = [];
    let cicloAtual = {
        inicio: new Date(dataAdmissao),
        diasUsados: 0,
        quantidadePeriodos: 0,
        ferias: []
    };

    feriasOrdenadas.forEach(f => {
        const dias = Math.round((f.fim - f.inicio) / 86400000) + 1;

        if (cicloAtual.diasUsados + dias <= DIAS_CICLO) {
            cicloAtual.ferias.push(f);
            cicloAtual.diasUsados += dias;
            cicloAtual.quantidadePeriodos++;
        } else {
            ciclos.push(cicloAtual);
            cicloAtual = {
                inicio: new Date(cicloAtual.inicio),
                diasUsados: dias,
                quantidadePeriodos: 1,
                ferias: [f]
            };
        }
    });

    ciclos.push(cicloAtual);

    return ciclos;
}

/* =====================================================
   SALDO DO CICLO ATUAL
===================================================== */
function calcularSaldoCicloAtual(ciclo) {
    return {
        diasUsados: ciclo.diasUsados,
        diasRestantes: Math.max(0, DIAS_CICLO - ciclo.diasUsados),
        quantidadePeriodos: ciclo.quantidadePeriodos,
        podeCriarNovoPeriodo:
            ciclo.quantidadePeriodos < 3 &&
            ciclo.diasUsados < DIAS_CICLO
    };
}

/* =====================================================
   LISTAR FÉRIAS (FRONT READY)
===================================================== */
async function listarFerias() {

    const [feriasRows, admissoes] = await Promise.all([
        FeriasModel.listarFerias(),
        listarAdmissoes()
    ]);

    const mapa = {};

    /* ===============================
       MONTA MAPA DE COLABORADORES
    ============================== */
    feriasRows.forEach(row => {
        if (!mapa[row.id_func]) {
            mapa[row.id_func] = {
                id: row.id_func,
                nome: row.nome,
                fotoperfil: row.fotoperfil,
                versao_foto: row.versao_foto,
                ferias: []
            };
        }

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
        const hojeagora = new Date();
        
        const aquisitivoInicio = calcularAquisitivoAtual(dataAdm, hojeagora);

        const aquisitivoFim = new Date(aquisitivoInicio);
        aquisitivoFim.setFullYear(aquisitivoFim.getFullYear() + 1);
        aquisitivoFim.setDate(aquisitivoFim.getDate() - 1);

        // ⚠️ ISSO É CONCESSIVO DE VERDADE
        const concessivoInicio = new Date(aquisitivoFim);
        concessivoInicio.setDate(concessivoInicio.getDate() + 1);

        const concessivoFim = new Date(aquisitivoFim);
        concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);

        /* ===============================
           CICLOS POR GOZO REAL
        ============================== */
        const ciclos = gerarCiclosPorGozo(dataAdm, colab.ferias);
        const cicloAnterior = ciclos[ciclos.length - 1];

        const saldoAnterior = calcularSaldoCicloAtual(cicloAnterior);

        // data de encerramento do ciclo (se fechou 30 dias)
        let dataEncerramento = null;
        if (saldoAnterior.diasUsados === 30 && cicloAnterior.ferias.length) {
            const ultima = cicloAnterior.ferias[cicloAnterior.ferias.length - 1];
            dataEncerramento = ultima.fim;
        }

        /* ===============================
           🔑 REGRA NOVA (EXPLÍCITA)
           - saldo novo nasce NO INÍCIO DO CONCESSIVO
           - somente se o ciclo anterior já fechou
        ============================== */
        const hoje = new Date();

        let saldoAtual;

        if (
            saldoAnterior.diasUsados === 30 &&
            hoje >= concessivoInicio
        ) {
            // novo ciclo liberado legalmente
            saldoAtual = {
                diasUsados: 0,
                diasRestantes: 30,
                quantidadePeriodos: 0,
                podeCriarNovoPeriodo: true
            };
        } else {
            // ainda estamos no ciclo anterior
            saldoAtual = saldoAnterior;
        }

        colab.ciclos = [{
            aquisitivoInicio,
            aquisitivoFim,
            concessivoInicio, // ✅ ADICIONAR
            concessivoFim,
            saldo: saldoAtual,
            cicloAtual: true,
            cicloEncerradoEm: dataEncerramento
        }];


        /* ===============================
           SUGESTÃO AUTOMÁTICA
        ============================== */
        if ((saldoAtual.diasRestantes <= 0) || (hoje < concessivoInicio)) return;
            console.log({
            funcionario: colab.id,
            nome: colab.nome,
            dataAdm: dataAdm,
            concessivoInicio: concessivoInicio
        });
        
        let baseData = dataEncerramento || concessivoInicio;

        let inicioSug = addMeses(baseData, INTERVALO_MIN_MESES);

        if (inicioSug < hoje) inicioSug = hoje;

        inicioSug = proximaSegunda(inicioSug);

        const fimSug = addDias(inicioSug, saldoAtual.diasRestantes - 1);

        colab.ferias.push({
            id: `sug-${colab.id}-${inicioSug.getTime()}`,
            inicio: inicioSug,
            fim: fimSug,
            status: 'sugerida',
            tipo: 'sugerida'
        });
    });

    return Object.values(mapa);
}


function calcularAquisitivoAtual(dataAdm, hoje = new Date()) {
    const adm = new Date(dataAdm);
    adm.setHours(0, 0, 0, 0);

    const ref = new Date(hoje);
    ref.setHours(0, 0, 0, 0);

    let inicio = new Date(adm);

    // trava de segurança (12 anos)
    for (let i = 0; i < 12; i++) {

        const fim = new Date(inicio);
        fim.setFullYear(fim.getFullYear() + 1);
        fim.setDate(fim.getDate() - 1);

        if (ref >= inicio && ref <= fim) {
            return inicio;
        }

        inicio.setFullYear(inicio.getFullYear() + 1);
    }

    return null;
}





/* =====================================================
   CRUD
===================================================== */
async function criarFerias(payload) {
    const { id_func, data_inicio, data_fim, status } = payload;

    return FeriasModel.criarFerias({
        datainicio: data_inicio,
        datafinal: data_fim,
        id_func,
        status: status || 'avaliar'
    });
}

async function atualizarFerias(idFerias, payload) {
    return FeriasModel.atualizarFerias(idFerias, {
        datainicio: payload.data_inicio,
        datafinal: payload.data_fim,
        descricao: payload.descricao || ''
    });
}

async function atualizarStatus(idFerias, status) {
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
