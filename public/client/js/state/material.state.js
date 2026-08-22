export const materialState = {

  BASE_URL: "/api",

  osSelecionada: null,

  dados: [],
  listaVariacoes: [],
  listaFiltrada: [],
  listaFornecedores: [],
  listaResponsaveis: [],
  listaOSDisponiveis: [],
  listasOS: [],
  listaSelecionada: null,
  filtroStatusAtual: "",
  filtroCategoriaAtual: "",
  modoVisualizacao: "kanban",
  listaMateriais: [],
  ordenacao: {
    coluna: null,
    direcao: "asc"
  },

  COLUNAS: {
    0: "id",
    1: "categoria",
    2: "nome",
    3: "codigo",
    4: "fabricante",
    5: "quantidade",
    6: "unidade",
    7: "observacao",
    8: "valor_orcamento_atual",
    9: "quantidade_separada",
    10: "fornecedor_nome",
    11: "menor_valor",
    12: "valorTotal",
    13: "oc"
  },

  STATUS: {
    PENDENTE: "pendente",
    PARCIAL: "parcial",
    SEPARADO: "separado",
    COMPRADO: "comprado"
  },

  atributosSelecionados: [],
  valoresCache: {}

};
