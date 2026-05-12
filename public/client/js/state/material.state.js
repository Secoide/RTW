export const materialState = {

  BASE_URL: "/api",

  osSelecionada: null,

  dados: [],
  listaVariacoes: [],
  listaFiltrada: [],
  listaFornecedores: [],
  filtroStatusAtual: "",
  listaMateriais: [],
  ordenacao: {
    coluna: null,
    direcao: "asc"
  },

  COLUNAS: {
    0: "id",
    1: "nome",
    2: "categoria",
    3: "quantidade",
    4: "codigo",
    5: "fabricante",
    6: "quantidade_separada",
    7: "id_fornecedor",
    8: "menor_valor",
    9: "valorTotal"
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