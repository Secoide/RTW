const OSModel = require('../models/os.model');

function validarCadastroOS(dados) {
  const camposObrigatorios = [
    ['idos', 'Número da OS'],
    ['descricao', 'Descrição da OS'],
    ['cliente', 'Cliente'],
    ['cidade', 'Cidade']
  ];

  const campoInvalido = camposObrigatorios.find(([campo]) => {
    return !String(dados[campo] ?? '').trim();
  });

  if (campoInvalido) {
    return `${campoInvalido[1]} é obrigatório.`;
  }

  dados.idos = String(dados.idos).trim();
  dados.descricao = String(dados.descricao).trim();
  return null;
}

// Listar todas as OS
 async function listarOrdemServico() {
   return await OSModel.getOrdemServico();
}

// Buscar um
async function buscarOrdemServico(id) {
  return await OSModel.getOrdemServicoById(id);
}

async function buscarOSPorData(dataDia) {

  return await OSModel
    .getOSByDate(dataDia);

}

async function salvarOS(dados) {
  if (dados.acao === "editOS") {
    await OSModel.atualizarOS(dados);
    return { sucesso: true };
  }

  if (dados.acao === "cadOS") {
    const erroValidacao = validarCadastroOS(dados);
    if (erroValidacao) {
      return { sucesso: false, mensagem: erroValidacao };
    }

    const existente = await OSModel.verificarOSExistente(dados.idos);
    if (existente.length > 0) {
      return { sucesso: false, mensagem: "OS já cadastrada." };
    }
    await OSModel.inserirOS(dados);
    return { sucesso: true };
  }

  return { sucesso: false, mensagem: "Ação inválida." };
}

// services/OSService.js
async function atualizarOS(id, data) {
  const camposValidos = {};
  if (data.status !== undefined) camposValidos.status = data.status;
  if (data.descricao !== undefined) camposValidos.descricao = data.descricao;
  if (data.orcado !== undefined) camposValidos.orcado = data.orcado;
  if (data.concluido !== undefined) camposValidos.concluido = data.concluido;
  if (data.criado !== undefined) camposValidos.criado = data.criado;
  if (data.empresa !== undefined) camposValidos.empresa = data.empresa;
  if (data.supervisor !== undefined) camposValidos.supervisor = data.supervisor;
  if (data.cidade !== undefined) camposValidos.cidade = data.cidade;
  if (data.responsavel !== undefined) camposValidos.responsavel = data.responsavel;

  if (Object.keys(camposValidos).length === 0) return false;

  // Passa só os campos válidos pro model
  return await OSModel.updateOS(id, camposValidos);
}




async function atualizarStatusOS(id, data) {
  if (!id) throw new Error('ID da OS é obrigatório');

  const atualizado = await OSModel.updateStatusOS(id, {
    statusOS: data.statusOS
  });

  if (!atualizado) {
    throw new Error('OS não encontrado para atualização');
  }

  return { id, ...data };
}

async function salvarAnotacoesOS(datadia,anotacoes,icone) {

  return await OSModel.salvarAnotacoesOS(
    datadia,
    anotacoes,
    icone
  );
}

async function buscarStatusOS(dataDia) {
  return await OSModel.getStatusOS(dataDia);
}

async function buscarAnotacoesOS(dataDia) {
  return await OSModel.getAnotacoesOS(dataDia);
}

async function listarPaineisOS(idOS) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  return await OSModel.listarPaineisOS(idOS);
}

async function vincularPainelOS(idOS, dados) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  if (!dados.id_painel) throw new Error('Selecione um painel para vincular.');

  await OSModel.vincularPainelOS({
    id_os: idOS,
    id_painel: dados.id_painel
  });

  return await OSModel.listarPaineisOS(idOS);
}

async function removerPainelOS(idOS, idPainel) {
  if (!idOS || !idPainel) throw new Error('OS e painel são obrigatórios');
  await OSModel.removerPainelOS(idOS, idPainel);
  return await OSModel.listarPaineisOS(idOS);
}

async function buscarComplementosOS(idOS) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  return await OSModel.buscarComplementosOS(idOS);
}

async function salvarComplementosOS(idOS, dados) {
  if (!idOS) throw new Error('ID da OS é obrigatório');

  return await OSModel.salvarComplementosOS({
    id_os: idOS,
    tipo_servico: dados.tipo_servico,
    pta_alocada: dados.pta_alocada === true || dados.pta_alocada === '1' || dados.pta_alocada === 'on',
    painel_eletrico_previsto: dados.painel_eletrico_previsto === true || dados.painel_eletrico_previsto === '1' || dados.painel_eletrico_previsto === 'on',
    observacao: dados.observacao
  });
}

// Deletar
async function deletarOS(id) {
  return await OSModel.deleteOS(id);
}


module.exports = {
  listarOrdemServico,
  buscarOrdemServico,
  buscarOSPorData,
  salvarOS,
  atualizarOS,
  atualizarStatusOS,
  salvarAnotacoesOS,
  buscarStatusOS,
  buscarAnotacoesOS,
  listarPaineisOS,
  vincularPainelOS,
  removerPainelOS,
  buscarComplementosOS,
  salvarComplementosOS,
  deletarOS
};
