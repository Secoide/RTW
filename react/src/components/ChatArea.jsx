import { useState } from "react";
import ReactMarkdown from "react-markdown";
import MessageRenderer from "./chats/MessageRenderer";
import DashboardHoje from "./chats/DashboardHoje";
import TextResponse from "./chats/TextResponse";

import {
    perguntarIA
}
    from "../services/iaService";

function ChatArea() {

    const [mensagem,
        setMensagem] =
        useState("");

    const [loading,
        setLoading] =
        useState(false);

    const [mensagens,
        setMensagens] =
        useState([
            {
                tipo: "bot",
                texto:
                    "Olá 👋 Como posso ajudar hoje?"
            }
        ]);

    async function enviar() {

        if (!mensagem.trim())
            return;

        const pergunta =
            mensagem;

        setMensagens(
            prev => [

                ...prev,

                {
                    tipo: "user",
                    texto: pergunta
                }

            ]
        );

        setMensagem("");

        setLoading(true);

        try {

            const resposta =
                await perguntarIA(
                    pergunta
                );

            if (
                resposta.tipo ===
                "dashboardHoje"
            ) {

                setMensagens(
                    prev => [

                        ...prev,

                        {
                            tipo: "dashboard",
                            dados: resposta
                        }

                    ]
                );

            }
            else if (
                resposta.tipo ===
                "texto"
            ) {

                setMensagens(
                    prev => [

                        ...prev,

                        {
                            tipo: "texto",
                            mensagem:
                                resposta.mensagem
                        }

                    ]
                );

            }
            else {

                setMensagens(
                    prev => [

                        ...prev,

                        {
                            tipo: "bot",
                            texto:
                                JSON.stringify(
                                    resposta
                                )
                        }

                    ]
                );

            }

        } catch (erro) {

            console.error(
                erro
            );

            setMensagens(
                prev => [

                    ...prev,

                    {
                        tipo: "bot",
                        texto:
                            "Erro ao consultar IA."
                    }

                ]
            );

        }

        setLoading(false);

    }

    return (

        <section className="ia2-chat">

            <div className="chat-header">

                <div>

                    <h2>
                        Conversa Atual
                    </h2>

                    <small>
                        Assistente Operacional RTW
                    </small>

                </div>

            </div>

            <div className="chat-messages">

                {
                    mensagens.map(
                        (
                            msg,
                            index
                        ) => (

                            <div
                                key={index}
                                className={
                                    `message ${msg.tipo}`
                                }
                            >

                                {
                                    msg.tipo === "dashboard"

                                        ? (
                                            <DashboardHoje
                                                dados={msg.dados}
                                            />
                                        )

                                        : msg.tipo === "texto"

                                            ? (
                                                <TextResponse
                                                    mensagem={msg.mensagem}
                                                />
                                            )

                                            : (

                                                <MessageRenderer
                                                    texto={msg.texto}
                                                />

                                            )
                                }

                            </div>

                        )
                    )
                }

                {
                    loading && (

                        <div
                            className=
                            "message bot"
                        >

                            💭 Pensando...

                        </div>

                    )
                }

            </div>

            <div className="quick-actions">

                <button
                    onClick={() =>
                        setMensagem(
                            "Quem trabalhou hoje?"
                        )}
                >
                    Quem trabalhou hoje?
                </button>

                <button
                    onClick={() =>
                        setMensagem(
                            "Quem está disponível?"
                        )}
                >
                    Disponíveis
                </button>

            </div>

            <div className="chat-input">

                <input

                    value={mensagem}

                    onChange={
                        e =>
                            setMensagem(
                                e.target.value
                            )
                    }

                    onKeyDown={
                        e => {

                            if (
                                e.key ===
                                "Enter"
                            ) {

                                enviar();

                            }

                        }
                    }

                    placeholder=
                    "Digite sua pergunta..."

                />

                <button
                    onClick={enviar}
                >

                    Enviar

                </button>

            </div>

        </section>

    );

}

export default ChatArea;