const EPIService = require('../services/epi.service');
const PDFDocument = require("pdfkit");
const supabase = require("../config/supabase");
const axios = require("axios");


// GET /api/epi
async function getEPIs(req, res) {
  try {
    const epis = await EPIService.listarEPIs();
    res.json(epis);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar EPIs' });
  }
}

// GET /api/epis/:id
async function getEPI(req, res) {
  try {
    const epi = await EPIService.buscarEPI(req.params.id);
    if (!epi) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(epi);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar EPI' });
  }
}


// POST /api/epis
async function createEPI(req, res) {
  try {
    const novo = await EPIService.criarEPI(req.body);
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

// PUT /api/epi/:id
async function updateEPI(req, res) {
  try {
    const ok = await EPIService.atualizarEPI(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar EPI' });
  }
}

// DELETE /api/epi/:id
async function deleteEPI(req, res) {
  try {
    const ok = await EPIService.deletarEPI(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar EPI' });
  }
}

async function deleteEPIByColaborador(req, res) {
  try {
    const ok = await EPIService.deletarEPIByColaborador(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar EPI' });
  }
}

// GET /api/epis/:id
async function getEPIsByColaborador(req, res) {
  try {
    const { idFunc } = req.params;

    const epi = await EPIService.buscarEPIsByColaborador(idFunc);

    if (!epi || epi.length === 0) {
      console.warn("⚠️ [AVISO] Nenhum EPI encontrado para o colaborador ID:", idFunc);
      return res.status(404).json({ erro: "Nenhum EPI encontrado" });
    }

    res.json(epi);
  } catch (err) {
    console.error("❌ [ERRO getEPIsByColaborador]:", err);
    res.status(500).json({
      erro: "Erro ao buscar EPI",
      detalhe: err.message || err,
    });
  }
}

async function getEPIsByColaboradorContem(req, res) {
  try {
    const { idfcepi } = req.params;

    const epi = await EPIService.buscarEPIsByColaboradorContem(idfcepi);

    if (!epi || epi.length === 0) {
      console.warn("⚠️ [AVISO] Nenhum EPI encontrado para o colaborador ID:", idfcepi);
      return res.status(404).json({ erro: "Nenhum EPI encontrado" });
    }

    res.json(epi);
  } catch (err) {
    console.error("❌ [ERRO getEPIsByColaborador]:", err);
    res.status(500).json({
      erro: "Erro ao buscar EPI",
      detalhe: err.message || err,
    });
  }
}


async function uploadEPI(req, res) {
  try {
    const { dataentregueEPI, nca, vencimento, idColab, epi } = req.body;
    const result = await EPIService.salvarEPI({
      dataentregueEPI,
      vencimento,
      idColab,
      nca,
      epi,
      file: req.file
    });

    res.status(201).json({
      id: result.id,
      message: 'EPI anexado com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao salvar epi:', err);
    res.status(400).json({ error: err.message });
  }
}

async function downloadEPI(req, res) {
  try {
    const { id } = req.params;
    const epi = await EPIService.baixarEPI(id);

    if (!epi) return res.status(404).json({ error: "EPI não encontrado" });
    if (!epi.anexoepiPDF) return res.status(400).json({ error: "Nenhum PDF anexado para este EPI." });

    const filePath = path.join(__dirname, "..", "storage", "epis", epi.anexoepiPDF);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });

    const nomeColab = epi.colaborador.replace(/\s+/g, "_");
    const nomeEPI = epi.epi.replace(/\s+/g, "_");
    const data = new Date(epi.datarealizada);
    const dataFinal = `${String(data.getDate()).padStart(2, "0")}-${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;
    const nomeFinal = `${nomeColab}_${nomeEPI}_${dataFinal}.pdf`;

    // headers certos
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nomeFinal}"`);

    // stream manual → garante o filename
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error("Erro ao baixar EPI:", err);
    res.status(500).json({ error: "Erro interno ao baixar EPI." });
  }
}

async function checkEPI(req, res) {
  try {
    const { id } = req.params;
    const epi = await EPIService.baixarEPI(id);

    if (!epi) return res.sendStatus(404);
    if (!epi.anexoEPIPDF) return res.sendStatus(400);

    const filePath = path.join(__dirname, "..", "storage", "epis", epi.anexoEPIPDF);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    // Se chegou aqui, está OK
    return res.sendStatus(200);
  } catch (err) {
    console.error("Erro no HEAD do EPI:", err);
    return res.sendStatus(500);
  }
}

async function uploadAssinatura(req, res) {
  try {
    const { idfcepi, assinaturaBase64 } = req.body;

    if (!idfcepi || !assinaturaBase64) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // 🔥 APAGA ASSINATURAS ANTIGAS
    await EPIService.apagarAssinaturasAntigas(idfcepi);

    // Converter Base64
    const base64Data = assinaturaBase64.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const filename = `assinatura_${idfcepi}_${Date.now()}.png`;

    // Upload no Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("epi-assinaturas")
      .upload(filename, buffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error(uploadError);
      return res.status(500).json({ error: "Erro ao salvar no Storage" });
    }

    // Salvar caminho no MySQL
    await EPIService.salvarCaminhoAssinatura(idfcepi, filename);

    return res.json({
      sucesso: true,
      arquivo: filename
    });

  } catch (error) {
    console.error("ERRO uploadAssinatura:", error);
    res.status(500).json({ error: "Erro interno ao salvar assinatura." });
  }
}


// Buscar assinatura (URL assinada)
async function getAssinatura(req, res) {
  try {
    const { idfcepi } = req.params;

    const resultado = await EPIService.buscarEPIsByColaboradorContem(idfcepi);

    // resultado = array → pegar o primeiro item
    const registro = resultado[0];

    if (!registro || !registro.assinatura_path) {
      return res.status(404).json({ error: "Sem assinatura encontrada." });
    }

    const { data: signed } = await supabase.storage
      .from("epi-assinaturas")
      .createSignedUrl(registro.assinatura_path, 3600);

    return res.json({ url: signed.signedUrl });

  } catch (error) {
    console.error("ERRO getAssinatura:", error);
    res.status(500).json({ error: "Erro ao buscar assinatura" });
  }
}


// Gerar PDF com assinatura
async function gerarPDFComAssinatura(req, res) {
  try {
    const { idfcepi } = req.params;

    // Buscar dados no MySQL (lista completa do colaborador + EPI)
    const registros = await EPIService.buscarEPIsByColaboradorContem(idfcepi);
    if (!registros || registros.length === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }

    const registro = registros[0];

    // Buscar assinatura no Storage
    let assinaturaBuffer = null;
    if (registro.assinatura_path) {
      const { data: signed } = await supabase.storage
        .from("epi-assinaturas")
        .createSignedUrl(registro.assinatura_path, 3600);

      const imgReq = await axios.get(signed.signedUrl, {
        responseType: "arraybuffer"
      });

      assinaturaBuffer = Buffer.from(imgReq.data);
    }

    // Criar PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ficha_epi_${idfcepi}.pdf`
    );

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18).text("FICHA DE ENTREGA DOS EPI", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12)
      .text("RTW ENGENHARIA LTDA – CNPJ 15.498.104/0001-45")
      .text("End.: Assis Brasil, Nº 102 - Centro - Santa Cruz do Sul - RS")
      .text("Contato: (51) 3056-2916 / (51) 99903-4744")
      .moveDown(1);

    doc
      .fontSize(16)
      .text("FICHA DE CONTROLE E ENTREGA DOS EPI’s", { align: "center" })
      .moveDown(1);

    // Dados do Colaborador
    doc.fontSize(12)
      .text(`Nome do Colaborador: ${registro.colaborador}`)
      .text(`EPI Recebido: ${registro.epi}`)
      .text(`Data da Entrega: ${new Date(registro.dataentregue).toLocaleDateString("pt-BR")}`)
      .moveDown(2);

    // Tabela do EPI
    doc.fontSize(12).text("Itens do EPI Recebido:", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;

    doc.text("Data da Entegra", 40, tableTop);
    doc.text("Descrição do EPI", 180, tableTop);
    doc.text("N° CA", 390, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    registros.forEach((epi, i) => {
      const y = tableTop + 25 + i * 20;
      doc.text(new Date(epi.dataentregue).toLocaleDateString("pt-BR"), 40, y);
      doc.text(epi.epi, 180, y);
      doc.text(epi.numero_ca || "—", 390, y);
    });

    doc.moveDown(5);

    // Texto Legal
    doc.fontSize(12).text("Declaro para todos os efeitos legais que recebi os equipamentos listados acima e estou ciente das minhas responsabilidades conforme NR 06, NR 01 e CLT.", {
      align: "justify"
    });

    doc.moveDown(3);

    // Assinatura
    // Assinatura (título)
    doc.fontSize(12).text("Assinatura do Colaborador:", {
      underline: true,
      align: "right"
    });
    doc.moveDown(1);

    // CONFIGURAÇÃO DO BLOCO À DIREITA
    const blockWidth = 200; // largura do bloco
    const pageWidth = doc.page.width;
    const marginRight = doc.page.margins.right;

    // X do bloco encostado na direita
    const blockX = pageWidth - marginRight - blockWidth;

    if (assinaturaBuffer) {
      const assinaturaWidth = 250; // largura da imagem
      const assinaturaX = blockX + (blockWidth - assinaturaWidth) / 2; // centralizada no bloco
      const assinaturaY = doc.y;

      doc.image(assinaturaBuffer, assinaturaX, assinaturaY, {
        width: assinaturaWidth
      });

      // ajustar posição vertical
      doc.y = assinaturaY + 70;
    } else {
      doc.text("Sem assinatura registrada.", blockX, doc.y, {
        width: blockWidth,
        align: "center"
      });
      doc.moveDown(2);
    }

    // Nome (à direita, dentro do bloco)
    doc.text(registro.colaborador, blockX, doc.y, {
      width: blockWidth,
      align: "center"
    });

    // Data (à direita, dentro do mesmo bloco)
    doc.text(
      `${new Date().getDate()} de ${new Date().toLocaleString("pt-BR", { month: "long" })} de ${new Date().getFullYear()}`,
      blockX,
      doc.y,
      {
        width: blockWidth,
        align: "center"
      }
    );




    doc.end();

  } catch (err) {
    console.error("Erro ao gerar Ficha EPI PDF:", err);
    res.status(500).json({ error: "Erro ao gerar ficha EPI." });
  }
}

async function gerarFichaEPI(req, res) {
  try {
    const { idColab } = req.params;

    // Buscar todos os EPIs do colaborador (somente últimos entregues)
    const epis = await EPIService.buscarEPIsByColaborador(idColab);

    if (!epis || epis.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhum EPI encontrado para o colaborador." });
    }

    const nomeColaborador = epis[0].nomeColab;

    // Buscar última assinatura válida do colaborador
    let assinaturaFinal = null;

    const ultimaAssinatura = epis.find((e) => e.assinatura_path);

    if (ultimaAssinatura && ultimaAssinatura.assinatura_path) {
      try {
        const { data: signed } = await supabase.storage
          .from("epi-assinaturas")
          .createSignedUrl(ultimaAssinatura.assinatura_path, 3600);

        const sigReq = await axios.get(signed.signedUrl, {
          responseType: "arraybuffer",
        });

        assinaturaFinal = Buffer.from(sigReq.data);
      } catch (err) {
        console.error("Erro ao carregar assinatura final:", err);
      }
    }

    // Criar PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ficha_completa_epis_${idColab}.pdf`
    );

    doc.pipe(res);

    // Cabeçalho
    doc
      .fontSize(12)
      .text("RTW ENGENHARIA LTDA – CNPJ 15.498.104/0001-45")
      .text("End.: Assis Brasil, Nº 102 - Centro - Santa Cruz do Sul - RS")
      .text("Contato: (51) 3056-2916 / (51) 99903-4744")
      .moveDown(1);

    doc
      .fontSize(16)
      .text("FICHA DE CONTROLE E ENTREGA DOS EPI’s", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12).text(`Nome do Colaborador: ${nomeColaborador}`);
    doc.moveDown(2);

    // Título da tabela
    doc.fontSize(12).text("EPIs Entregues:", { underline: true });
    doc.moveDown(0.8);

    // Cabeçalho da tabela
    const tableTop = doc.y;

    doc.font("Helvetica-Bold");
    doc.text("Data Entrega", 40, tableTop);
    doc.text("Descrição do EPI", 150, tableTop);
    doc.text("Nº CA", 340, tableTop);
    doc.text("Assinatura", 430, tableTop);

    doc
      .moveTo(40, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor("#000")
      .lineWidth(1)
      .stroke();

    doc.font("Helvetica");

    // Tabela dos EPIs
    const rowHeight = 25;
    const signatureWidth = 130;
    const signatureHeight = 35;
    const signatureX = 415;

    for (let i = 0; i < epis.length; i++) {
      const epi = epis[i];
      const y = tableTop + 20 + i * rowHeight;

      // Colunas de texto
      doc.fontSize(10)
        .text(epi.ultimaEntrega || "-", 40, y)
        .text(epi.nome, 150, y)
        .text(epi.numero_ca || "-", 340, y);

      // 🔹 POSIÇÃO DA LINHA (horizontal)
      const linhaY = y + rowHeight - 12;

      // 🔹 1) LINHA CINZA EM TODA A TABELA (40 → 550)
      doc.moveTo(40, linhaY)
        .lineTo(550, linhaY)
        .strokeColor("#cccccc")
        .lineWidth(0.6)
        .stroke();

      // 🔹 2) Se tem assinatura, desenhar POR CIMA DA LINHA
      if (epi.assinatura_path) {
        try {
          const { data: signed } = await supabase.storage
            .from("epi-assinaturas")
            .createSignedUrl(epi.assinatura_path, 3600);

          const sigReq = await axios.get(signed.signedUrl, {
            responseType: "arraybuffer"
          });

          const assinatura = Buffer.from(sigReq.data);

          // posição da assinatura: exatamente sobre a linha
          const assinaturaY = linhaY - signatureHeight / 2 ;

          doc.image(assinatura, signatureX, (assinaturaY - 7), {
            width: signatureWidth,
            height: signatureHeight
          });

        } catch (err) {
          console.error("Erro carregar assinatura:", err);
          doc.text("ERRO", signatureX, y);
        }

      } else {
        // 🔸 Sem assinatura: mostra linha de assinatura por cima da linha completa
        doc.text("", signatureX, linhaY - 5);
      }
    }
  


    // Texto legal
    doc.moveDown(4);
  doc.fontSize(8).text(
    `(Com base em disposições legais da CLT e das Normas Regulamentadoras NR 01 e NR 06, do Ministério do Trabalho e Emprego)`,
    40,
    doc.y,
    {
      width: doc.page.width - 80,
      align: "justify",
    }
  );

  doc.moveDown(8);

  doc.font("Helvetica-Bold");
  doc.fontSize(10).text(
    `O objetivo desta Guia é servir de meio de entrega e controle dos Equipamentos de Proteção Individual (EPIs) que ficarão aos cuidados do Colaborador abaixo identificado.`,
    40,
    doc.y,
    {
      width: doc.page.width - 80,
      align: "center",
    }
  );
  doc.font("Helvetica");
  doc.moveDown(3);
  doc.fontSize(10).text(`Nome do Colaborador: ${nomeColaborador}`);
  doc.fontSize(10).text(`Função: -`);

  // Nova página
  doc.addPage();
  doc.y = doc.page.margins.top;

  // Texto extenso legal
  doc.fontSize(10).text(
    `O número do Certificado de Aprovação (CA) encontra-se impresso em caracteres indeléveis e bem visíveis no EPI e deverá ser verificado e confirmado através de rubrica do responsável pela entrega.

      Declaro para todos efeitos legais que recebi da empresa RTW ENGENHARIA LTDA, CNPJ: 15.498.104/0001-45, os Equipamentos de Proteção Individual constantes da lista em anexo, novos e em perfeitas condições de uso, e que estou ciente das obrigações descritas na NR 06, baixada pela Portaria MTb 3214/78, subitem 6.7.1, a saber:
      a) usar, utilizando-o apenas para a finalidade a que se destina;
      b) responsabilizar-se pela guarda e conservação;
      c) comunicar ao empregador qualquer alteração que o torne impróprio para uso; 
      d) cumprir as determinações do empregador sobre o uso adequado; e.
      e) fico proibido de dar ou emprestar o equipamento que estiver sob minha responsabilidade, só podendo fazê-lo se receber ordem por escrito da pessoa autorizada para tal fim.

      Declaro, também, que estou ciente das disposições do Art. 462 e § 1º da CLT, e autorizo o desconto salarial proporcional ao custo de reparação do dano que os EPIs aos meus cuidados venham apresentar.
      Declaro ainda que estou ciente das disposições do artigo 158, alínea “a”, da CLT, e do item 1.8 da NR 01, em especial daquela do subitem 1.8.1, de que constitui ato faltoso à recusa injustificada de usar EPI fornecido pela empresa, incorrendo nas penas da Lei cabíveis que irão desde simples advertências até a dispensa por justa causa (Art. 482 da C.L.T).
      `,
    {
      align: "justify",
    }
  );

  doc.moveDown(4);

  // Assinatura final à direita
  const blockWidth = 200;
  const pageWidth2 = doc.page.width;
  const marginRight = doc.page.margins.right;
  const blockX = pageWidth2 - marginRight - blockWidth;

  if (assinaturaFinal) {
    const assinaturaWidth = 220;
    const assinaturaX = blockX + (blockWidth - assinaturaWidth) / 2;
    const assinaturaY = doc.y;

    doc.image(assinaturaFinal, assinaturaX, assinaturaY, {
      width: assinaturaWidth,
      height: 70,
    });

    doc.y = assinaturaY + 65;
  } else {
    doc.text("Sem assinatura registrada.", blockX, doc.y, {
      width: blockWidth,
      align: "center",
    });
    doc.moveDown(2);
  }

  doc.text(nomeColaborador, blockX, doc.y, {
    width: blockWidth,
    align: "center",
  });

  doc.text(
    `${new Date().getDate()} de ${new Date().toLocaleString("pt-BR", {
      month: "long",
    })} de ${new Date().getFullYear()}`,
    blockX,
    doc.y,
    {
      width: blockWidth,
      align: "center",
    }
  );

  doc.end();
} catch (err) {
  console.error("Erro ao gerar ficha completa de EPI:", err);
  res.status(500).json({ error: "Erro ao gerar ficha completa de EPI." });
}
}



module.exports = {
  getEPIs,
  getEPI,
  createEPI,
  updateEPI,
  deleteEPI,
  getEPIsByColaborador,
  getEPIsByColaboradorContem,
  deleteEPIByColaborador,
  uploadEPI,
  downloadEPI,
  checkEPI,
  uploadAssinatura,
  getAssinatura,
  gerarPDFComAssinatura,
  gerarFichaEPI
};
