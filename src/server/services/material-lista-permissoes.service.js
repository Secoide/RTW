const MaterialOS = require("../models/materialOS.model");

function permissoesLista(lista, usuario, contexto) {
  const criador = Boolean(usuario?.id && lista.criado_por && String(usuario.id) === String(lista.criado_por));
  const setor = String(contexto?.setor || "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  const setores = { orcamento: ["orcamento", "orcamentos"], engenharia: ["engenharia"], estoque: ["estoque", "almoxarifado"], compras: ["compras"] };
  return {
    pode_gerenciar: criador,
    pode_mudar_estagio: criador || Boolean(usuario?.id && setores[lista.status]?.includes(setor))
  };
}

function exigirPermissaoLista(acao) {
  return async function (req, res, next) {
    try {
      const lista = await MaterialOS.getListaById(req.params.id);
      if (!lista) return res.status(404).json({ erro: "Lista não encontrada." });
      const contexto = await MaterialOS.buscarContextoSetorUsuario(req.user.id);
      const permissoes = permissoesLista(lista, req.user, contexto);
      if (!permissoes[acao]) {
        return res.status(403).json({ erro: acao === "pode_mudar_estagio"
          ? "Somente o criador ou um usuário do setor do estágio atual pode mudar o estágio."
          : "Somente o usuário que criou a lista pode realizar esta ação." });
      }
      req.listaMaterial = lista;
      next();
    } catch (erro) {
      console.error("Erro ao verificar permissão da lista:", erro);
      res.status(500).json({ erro: "Não foi possível verificar a permissão da lista." });
    }
  };
}

module.exports = { permissoesLista, exigirPermissaoLista };
