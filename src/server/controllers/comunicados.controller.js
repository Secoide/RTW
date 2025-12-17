const ComunicadosService = require("../services/comunicados.service");

// ======================================
// MÉTODOS DO CONTROLLER
// ======================================

async function getAll(req, res) {
    try {
        const dados = await ComunicadosService.listarTodos();
        res.json(dados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar comunicados" });
    }
}

async function getByCategoria(req, res) {
    try {
        const categoria = req.params.categoria;
        const dados = await ComunicadosService.listarPorCategoria(categoria);
        res.json(dados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar comunicados da categoria" });
    }
}

async function create(req, res) {
  try {
      const { categoria, titulo, texto, icone } = req.body;

      if (!categoria || !titulo || !texto) {
          return res.status(400).json({ erro: "Campos obrigatórios faltando" });
      }

      // ✔ pega do middleware com segurança
      const criado_por = req.user.id;

      const id = await ComunicadosService.novo({
          categoria,
          titulo,
          texto,
          icone,
          criado_por
      });

      res.json({ sucesso: true, id });

  } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao criar comunicado" });
  }
}


async function getItem(req, res) {
    try {
        const id = req.params.id;
        const item = await ComunicadosService.buscarPorId(id);

        if (!item) return res.status(404).json({ erro: "Aviso não encontrado" });

        res.json(item);

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar aviso" });
    }
}

async function update(req, res) {
    try {
        const id = req.params.id;
        const { categoria, titulo, texto, icone } = req.body;

        if (!titulo || !texto) {
            return res.status(400).json({ erro: "Campos obrigatórios faltando" });
        }

        const avisoExistente = await ComunicadosService.buscarPorId(id);
        if (!avisoExistente) {
            return res.status(404).json({ erro: "Aviso não encontrado" });
        }

        // 🛡 PERMISSÃO
        const isCriador = req.user.id === avisoExistente.criado_por;
        const nivel = req.user.role; // ← vem da sessão
        const isDiretoria = nivel == 5;
        const isAdmin = nivel == 99;

        if (!isCriador && !isDiretoria && !isAdmin) {
            return res.status(403).json({ erro: "Sem permissão para editar este aviso" });
        }

        await ComunicadosService.editar(id, { categoria, titulo, texto, icone });

        res.json({ sucesso: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar comunicado" });
    }
}


async function deleteItem(req, res) {
    try {
        const id = req.params.id;

        const avisoExistente = await ComunicadosService.buscarPorId(id);
        if (!avisoExistente) {
            return res.status(404).json({ erro: "Aviso não encontrado" });
        }

        // 🛡 PERMISSÃO
        const isCriador = req.user.id === avisoExistente.criado_por;
        const nivel = req.user.role; // ← vem da sessão
        const isDiretoria = nivel == 5;
        const isAdmin = nivel == 99;
        console.log(nivel);

        if (!isCriador && !isDiretoria && !isAdmin) {
            return res.status(403).json({ erro: "Sem permissão para excluir este aviso" });
        }

        await ComunicadosService.excluir(id);

        res.json({ sucesso: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir aviso" });
    }
}



// ======================================
// EXPORTS (FORMATO QUE SEU PROJETO USA)
// ======================================

module.exports = {
    getAll,
    getByCategoria,
    create,
    getItem,
    update,
    deleteItem
};
