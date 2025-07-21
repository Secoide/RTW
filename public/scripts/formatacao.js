// TELEFONE - formatação em tempo real
let isDeleting = false;
$(document).on('keydown', '#telefone', function (e) {
    // Detecta se é tecla de apagar
    isDeleting = (e.key === "Backspace" || e.key === "Delete");
});

$(document).on('input', '#telefone', function () {
    let val = $(this).val();

    // Remove todos os caracteres que não forem dígitos
    let num = val.replace(/\D/g, '').slice(0, 11);

    // Se está apagando, não reformatar agora
    if (isDeleting) {
        isDeleting = false;
        return;
    }

    // Formata se não estiver apagando
    let formatado = '';

    if (num.length > 0) {
        formatado += `(${num.slice(0, 2)}`;
    }
    if (num.length >= 2) {
        formatado += `) `;
    }
    if (num.length >= 3) {
        formatado += `${num.slice(2, 3)} `;
    }
    if (num.length >= 7) {
        formatado += `${num.slice(3, 7)}-${num.slice(7)}`;
    } else if (num.length > 3) {
        formatado += num.slice(3);
    }

    $(this).val(formatado);
});


// E-MAIL - sugestões automáticas após "@"
const dominios = ['gmail.com', 'hotmail.com', 'outlook.com.br', 'icloud.com'];

$(document).on('input', '#mail', function (e) {
    const val = $(this).val();
    const atIndex = val.indexOf('@');
    const $suggestions = $('#email-suggestions');

    if (atIndex > -1 && !val.slice(atIndex + 1).includes('.')) {
        const texto = val.slice(0, atIndex);
        const dominioDigitado = val.slice(atIndex + 1);
        const matches = dominios
            .filter(d => d.startsWith(dominioDigitado))
            .map(d => `${texto}@${d}`);

        if (matches.length) {
            $suggestions.empty().show();
            matches.forEach(match => {
                $suggestions.append(`<div>${match}</div>`);
            });

            const offset = $(this).offset();
            $suggestions.css({
                top: offset.top + $(this).outerHeight(),
                left: offset.left
            });
        } else {
            $suggestions.hide();
        }
    } else {
        $suggestions.hide();
    }
});
// Clique em sugestão
$(document).on('click', '#email-suggestions div', function () {
    $('#mail').val($(this).text());
    $('#email-suggestions').hide();
});

// Oculta ao clicar fora
$(document).on('click', function (e) {
    if (!$(e.target).is('#mail, #email-suggestions, #email-suggestions *')) {
        $('#email-suggestions').hide();
    }
});



function formatarCPF(campo) {
    let valor = campo.value.replace(/\D/g, ''); // Remove tudo que não é número

    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

    // Aplica a máscara: 000.000.000-00
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    campo.value = valor;
}

function formatarDataISO(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

