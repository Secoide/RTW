const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function enviarEmail({ para, assunto, html }) {
    try {
        await transporter.sendMail({
            from: `"Recuperar Senha - RTW Engenharia" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: assunto,
            html: html
        });

        return { sucesso: true };
    } catch (err) {
        console.error("Erro ao enviar email:", err);
        return { sucesso: false, mensagem: "Falha ao enviar e-mail." };
    }
}

module.exports = { enviarEmail };
