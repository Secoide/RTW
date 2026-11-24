export function parseAtributos(str) {

    if (!str || str === "{}") return {};
    if (typeof str === "object") return str;

    // 🔥 limpa aspas externas
    str = str.replace(/^"(.*)"$/, "$1");

    const obj = {};

    str.split("|").forEach(par => {

        const separador = par.indexOf(":");
        if (separador < 0) return;
        let key = par.slice(0, separador);
        let val = par.slice(separador + 1);

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
