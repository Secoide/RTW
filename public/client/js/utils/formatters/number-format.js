export function formatarTelefoneParaWhatsApp(telefone) {
    // Remove tudo que não for número
    let digits = telefone.replace(/\D/g, "");

    // Se começar com 0, remove (ex: 051 → 51)
    if (digits.startsWith("0")) digits = digits.substring(1);

    // Adiciona DDI 55 se não tiver
    if (!digits.startsWith("55")) digits = "55" + digits;

    return digits;
}