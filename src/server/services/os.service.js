const OSModel = require('../models/os.model');
const supabase = require("../config/supabase");

const BUCKET_ANEXOS_OS = "exames";
const PASTA_ANEXOS_OS = "os_anexos";

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

async function buscarHistoricoColaboradoresOS(idOS) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  return await OSModel.getHistoricoColaboradoresOS(idOS);
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
      return {
        sucesso: false,
        codigo: "OS_DUPLICADA",
        mensagem: "OS já cadastrada."
      };
    }
    try {
      await OSModel.inserirOS(dados);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        const mensagemBanco = String(err.sqlMessage || err.message || "");
        if (mensagemBanco.includes("PRIMARY") || mensagemBanco.includes("id_OSs")) {
          return {
            sucesso: false,
            codigo: "OS_DUPLICADA",
            mensagem: "OS já cadastrada."
          };
        }

        if (mensagemBanco.includes("descricao")) {
          return {
            sucesso: false,
            codigo: "DESCRICAO_DUPLICADA",
            mensagem: "Já existe uma OS com essa descrição. O sistema tentou liberar descrições repetidas; tente salvar novamente."
          };
        }
      }

      throw err;
    }
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

async function listarAnexosOS(idOS) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  return await OSModel.listarAnexosOS(idOS);
}

async function salvarAnexoOS(idOS, dados, file, usuario) {
  if (!idOS) throw new Error('ID da OS é obrigatório');
  if (!String(dados.nome || '').trim()) throw new Error('Informe o nome do documento.');
  if (!file || !file.buffer) throw new Error('Selecione um PDF para anexar.');

  const os = await OSModel.getOrdemServicoById(idOS);
  if (!os) throw new Error('OS nÃ£o encontrada para anexar documento.');

  const nomeLimpo = String(dados.nome).trim();
  const nomeArquivo = `${PASTA_ANEXOS_OS}/${idOS}_${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET_ANEXOS_OS)
    .upload(nomeArquivo, file.buffer, {
      contentType: "application/pdf",
      upsert: true
    });

  if (error) {
    console.error(error);
    throw new Error("Erro ao enviar PDF ao Supabase.");
  }

  const id = await OSModel.inserirAnexoOS({
    id_os: idOS,
    nome: nomeLimpo,
    arquivo_pdf: nomeArquivo,
    criado_por: usuario?.id || null
  });

  return {
    id,
    message: "Documento anexado com sucesso."
  };
}

async function buscarAnexoOS(idAnexo) {
  if (!idAnexo) throw new Error('ID do anexo é obrigatório');
  const anexo = await OSModel.buscarAnexoOS(idAnexo);
  if (!anexo) throw new Error('Anexo não encontrado.');
  return anexo;
}

async function removerAnexoOS(idAnexo) {
  const anexo = await buscarAnexoOS(idAnexo);

  if (anexo.arquivo_pdf) {
    await supabase.storage
      .from(BUCKET_ANEXOS_OS)
      .remove([anexo.arquivo_pdf]);
  }

  const ok = await OSModel.removerAnexoOS(idAnexo);
  if (!ok) throw new Error('Anexo não encontrado.');

  return { message: "Anexo removido com sucesso." };
}

// Deletar
async function deletarOS(id) {
  return await OSModel.deleteOS(id);
}


module.exports = {
  listarOrdemServico,
  buscarOrdemServico,
  buscarHistoricoColaboradoresOS,
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
  listarAnexosOS,
  salvarAnexoOS,
  buscarAnexoOS,
  removerAnexoOS,
  deletarOS
};
