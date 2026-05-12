import { calcularValorRS, calcularScore } from "../material.utils.js";

export function renderTabelaFornecedores(res, idMaterial) {

  if (!res || !res.length) {
    return `
    <tr class="linha-fornecedores">
      <td colspan="11">

        <div class="fornecedores-box vazio">

          <div class="sem-fornecedores">
            <i class="fa-solid fa-circle-info"></i>
            <span>Nenhum fornecedor cadastrado</span>
          </div>

          <button class="add-fornecedor destaque" data-id="${idMaterial}">
            <i class="fa-solid fa-plus"></i>
            Adicionar fornecedor
          </button>

        </div>

      </td>
    </tr>
  `;
  }

  // 🔥 calcula valores UMA VEZ
  const valores = res.map(f =>
    calcularValorRS(Number(f.valor || 0), f.icms)
  );

  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);

  // 🔥 calcula score UMA VEZ
  const listaProcessada = res.map(f => {

    const valorRS = calcularValorRS(Number(f.valor || 0), f.icms);
    const prazo = Number(f.prazo || 1);
    const materialOK = f.material_ok == 1;

    const score = calcularScore(valorRS, prazo, materialOK, minValor, maxValor);

    return {
      ...f,
      valorRS,
      score
    };
  });

  const scores = listaProcessada.map(f => f.score);
  const menorScore = Math.min(...scores);
  const maiorScore = Math.max(...scores);

  let html = "";

  listaProcessada.forEach(f => {

    const isMelhor = f.score === maiorScore;
    const isPior = f.score === menorScore;

    const valorFormatado = isNaN(f.valorRS)
      ? "-"
      : Number(f.valorRS).toFixed(2);

    html += `
      <tr 
        data-score="${f.score}"
        class="
          ${f.selecionado ? 'selecionado' : ''}
          ${isMelhor ? 'melhor-preco' : ''}
          ${isPior ? 'pior-preco' : ''}
        ">

        <td>${f.nome_fornecedor}</td>

        <td>R$ ${Number(f.valor).toFixed(2)}</td>

        <td>
          ${f.icms ?? '0'}
        </td>

        <td>${f.quantidade || '-'}</td>

        <td style="text-align:center">
          <input type="checkbox" disabled ${f.material_ok ? 'checked' : ''}>
        </td>

        <td>${f.prazo || 1}</td>

        <td>${f.orcamento || '-'}</td>

        <td title="${f.observacao || ''}">
          ${(f.observacao || '-').length > 20
        ? f.observacao.substring(0, 20) + '...'
        : f.observacao || '-'}
        </td>

        <!-- 🔥 VALOR COM COR -->
        <td class="valor-rs ${f.valorRS === minValor ? 'melhor' : f.valorRS === maxValor ? 'pior' : ''}">
          ${valorFormatado === "-" ? "-" : "R$ " + valorFormatado}
        </td>

        <!-- 🔥 SCORE VISUAL -->
        <td class="score">
          <div class="score-box">

            <div class="score-bar">
              <div 
                class="score-fill">
              </div>
            </div>

            <span class="score-text">${f.score.toFixed(2)}</span>

          </div>
        </td>

        <td>
          ${!f.selecionado ? `
            <button class="selecionar-forn"
              data-id="${f.id}" 
              data-material="${idMaterial}">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : ''}

          <button class="deletar-forn" data-id="${f.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>

      </tr>
    `;
  });

  return `
    <tr class="linha-fornecedores">
      <td colspan="11">

        <div class="fornecedores-box">
          <table class="tb-fornecedores">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Valor</th>
                <th>ICMS</th>
                <th>Qtd</th>
                <th>OK</th>
                <th>Prazo</th>
                <th>Orçamento</th>
                <th>Obs</th>
                <th>Valor RS</th>
                <th>Score</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${html}
            </tbody>
            
          </table>
          <button class="add-fornecedor" data-id="${idMaterial}">
            + fornecedor
          </button>
        </div>

      </td>
    </tr>
  `;
}