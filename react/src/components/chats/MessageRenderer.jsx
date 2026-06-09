function MessageRenderer({ texto }) {

    const html = texto

        .replace(
            /\$%(.*?)\$%/g,
            '<span class="tag-colaborador">$1</span>'
        )

        .replace(
            /#%(.*?)#%/g,
            '<span class="tag-empresa">$1</span>'
        )

        .replace(
            /@%(.*?)@%/g,
            '<span class="tag-os">$1</span>'
        )

        .replace(/\n/g, "<br>");

    return (
        <div
            dangerouslySetInnerHTML={{
                __html: html
            }}
        />
    );
}

export default MessageRenderer;