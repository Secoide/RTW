export const ATRIBUTOS_POR_MATERIAL = {

    // 🔥 PROTEÇÃO
    "DISJUNTOR": [
        "Corrente",
        "Curva",
        "Polos",
        "Capacidade de interrupção"
    ],

    "DPS": [
        "Tensão",
        "Corrente de descarga",
        "Classe"
    ],

    // 🔌 CONDUTORES
    "CABO": [
        "Bitola",
        "Material",
        "Cor"
    ],

    // 💡 ILUMINAÇÃO
    "LUMINARIA": [
        "Potência",
        "Tensão",
        "Temperatura de cor"
    ],


    // 🔘 TOMADAS E COMANDO
    "TOMADA": [
        "Corrente",
        "Padrão",
        "Cor"
    ],

    "INTERRUPTOR": [
        "Tipo",
        "Corrente",
        "Cor"
    ],

    // 🎛 CONTROLE
    "CONTATOR": [
        "Corrente",
        "Tensão de bobina",
        "Número de polos"
    ],

    "RELE": [
        "Tensão",
        "Tipo",
        "Faixa de ajuste"
    ],

    "BORNE": [
        "Bitola",
        "Tipo",
        "Cor"
    ],

    // 🔧 INFRAESTRUTURA

    "ELETRODUTO": [
        "Tipo",
        "Material",
        "Diâmetro",
        "Comprimento",
        "Cor",
        "Acabamento"
    ],

    "LUVA ELETRODUTO": [
        "Bitola",
        "Material",
        "Acabamento"
    ],

    "CURVA ELETRODUTO": [
        "Ângulo",
        "Bitola",
        "Material",
        "Tipo"
    ],

    "CONDULETE": [
        "Tipo", // X, T, L, C
        "Bitola",
        "Material",
        "Vedação",
        "Cor"
    ],

    "ABRAÇADEIRA": [
        "Tipo",
        "Bitola",
        "Material",
        "Revestimento"
    ],

    "SUPORTE ELETRODUTO": [
        "Tipo",
        "Material",
        "Fixação"
    ],

    "CONECTOR BOX": [
        "Modelo",
        "Bitola",
        "Material"
    ],

    // 🔹 ELETROCALHA E ACESSÓRIOS

    "ELETROCALHA": [
        "Modelo",
        "Tipo",
        "Largura",
        "Altura",
        "Espessura",
        "Material"
    ],

    "TAMPA ELETROCALHA": [
        "Largura",
        "Material",
        "Espessura"
    ],

    "CURVA HORIZONTAL": [
        "Raio",
        "Largura",
        "Material",
        "Espessura"
    ],

    "CURVA VERTICAL INTERNA": [
        "Raio",
        "Largura",
        "Material"
    ],

    "CURVA VERTICAL EXTERNA": [
        "Raio",
        "Largura",
        "Material"
    ],

    "TÊ HORIZONTAL": [
        "Modelo",
        "Largura",
        "Material",
        "Espessura"
    ],

    "CRUZETA": [
        "Largura",
        "Material",
        "Espessura"
    ],

    "REDUÇÃO": [
        "Entrada",
        "Saída",
        "Material"
    ],

    "JUNÇÃO": [
        "Tipo", // simples, reforçada
        "Largura",
        "Material"
    ],

    "JUNÇÃO TELESCÓPICA": [
        "Largura",
        "Altura",
        "Material"
    ],

    // 🔹 PERFILADO / UNISTRUT

    "PERFILADO": [
        "Tipo",
        "Tamanho",
        "Espessura",
        "Material",
        "Comprimento"
    ],

    "EMENDA PERFILADO": [
        "Tipo",
        "Material"
    ],

    "SUPORTE PERFILADO": [
        "Tipo",
        "Fixação",
        "Material"
    ],

    // 🔹 CANALETAS

    "CANALETA": [
        "Largura",
        "Altura",
        "Material",
        "Cor",
        "Tipo"
    ],

    "TAMPA CANALETA": [
        "Largura",
        "Material"
    ],

    "CANALETA": [
        "Largura",
        "Altura",
        "Material"
    ],

    "CONDULETE": [
        "Tipo",
        "Bitola",
        "Material",
        "Acabamento",
        "Cor"
    ],

    "CURVA HORIZONTAL": [
        "Largura",
        "Material"
    ],

    "PARAFUSO": [
        "Diâmetro",
        "Comprimento",
        "Tipo",
        "Material"
    ],

    "SUPORTE": [
        "Tipo",
        "Fixação",
        "Tamanho"
    ],

    // 🧱 PAINÉIS
    "QUADRO": [
        "Dimensões",
        "Material",
        "Grau de proteção"
    ],
    "PAINEL": [
        "Dimensões",
        "Material",
        "Grau de proteção"
    ],
    "BLOCO DE DISTRIBUIÇÃO": [
        "Corrente",
        "Número de polos"
    ],
    "SINALEIRO": [
        "Cor",
        "Tensão"
    ],
    "BARRAMENTO PENTE": [
        "Polos",
        "Corrente",
        "Módulos"
    ]

};


export const CATEGORIA_POR_MATERIAL = {

    // 🔥 PROTEÇÃO
    "DISJUNTOR TRIFÁSICO": "Proteção Elétrica",
    "DPS": "Proteção Elétrica",

    // 🔌 CONDUTORES
    "CABO": "Condutores",

    // 💡 ILUMINAÇÃO
    "LUMINARIA": "Iluminação",

    // 🎛 CONTROLE
    "CONTATOR": "Comando e Controle",
    "RELE": "Comando e Controle",
    "BORNE": "Comando e Controle",
    "INTERRUPTOR": "Comando e Controle",

    // 🔘 TOMADAS
    "TOMADA": "Tomadas e Conexões",

    // 🔧 INFRAESTRUTURA
    "ELETRODUTO": "Infraestrutura",
    "LUVA ELETRODUTO": "Infraestrutura",
    "CURVA ELETRODUTO": "Infraestrutura",
    "CONDULETE": "Infraestrutura",
    "ABRAÇADEIRA": "Fixação", // 🔥 aqui faz mais sentido ficar em fixação
    "SUPORTE ELETRODUTO": "Infraestrutura",
    "CONECTOR BOX": "Infraestrutura",

    // 🔹 ELETROCALHA E ACESSÓRIOS
    "ELETROCALHA": "Infraestrutura",
    "TAMPA ELETROCALHA": "Infraestrutura",
    "CURVA HORIZONTAL": "Infraestrutura",
    "CURVA VERTICAL INTERNA": "Infraestrutura",
    "CURVA VERTICAL EXTERNA": "Infraestrutura",
    "TÊ HORIZONTAL": "Infraestrutura",
    "CRUZETA": "Infraestrutura",
    "REDUÇÃO": "Infraestrutura",
    "JUNÇÃO": "Infraestrutura",
    "JUNÇÃO TELESCÓPICA": "Infraestrutura",

    // 🔹 PERFILADO
    "PERFILADO": "Infraestrutura",
    "EMENDA PERFILADO": "Infraestrutura",
    "SUPORTE PERFILADO": "Infraestrutura",

    // 🔹 CANALETAS
    "CANALETA": "Infraestrutura",
    "TAMPA CANALETA": "Infraestrutura",

    // 🔩 FIXAÇÃO
    "PARAFUSO": "Fixação",

    // 🧱 PAINÉIS
    "QUADRO": "Painéis",
    "PAINEL": "Painéis",
    "BLOCO DE DISTRIBUIÇÃO": "Componente Painel",
    "SINALEIRO": "Componente Painel",
    "BARRAMENTO PENTE": "Componente Painel"

};