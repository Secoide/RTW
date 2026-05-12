export function parseAtributos(str) {

    if (!str || str === "{}") return {};

    // 🔥 limpa aspas externas
    str = str.replace(/^"(.*)"$/, "$1");

    const obj = {};

    str.split("|").forEach(par => {

        let [key, val] = par.split(":");

        if (!key || !val) return;

        key = key.trim();

        val = val
            .replace(/\\"/g, '"')   // \" → "
            .replace(/^"(.*)"$/, "$1") // remove aspas externas
            .trim();

        obj[key] = val;
    });

    return obj;
}

export function normalizarAtributo(attr) {

  if (!attr) return "";

  return attr
    .replace(/"/g, "")   // remove aspas
    .trim()
    .toLowerCase();      // padroniza

}