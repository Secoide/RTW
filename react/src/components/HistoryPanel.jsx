function HistoryPanel() {

    const historico = [
        {
            titulo: "Quem trabalhou hoje?",
            hora: "10:32"
        },
        {
            titulo: "Disponíveis amanhã",
            hora: "Ontem"
        },
        {
            titulo: "Ranking PMB",
            hora: "Ontem"
        },
        {
            titulo: "Aniversariantes",
            hora: "2 dias"
        }
    ];

    return (

        <aside className="ia2-history">

            <div className="ia2-panel">

                <div className="panel-header">

                    <h3>Histórico</h3>

                    <button className="btn-add">
                        +
                    </button>

                </div>

                <div className="history-list">

                    {
                        historico.map((item, index) => (

                            <div
                                key={index}
                                className="history-item"
                            >

                                <div className="history-title">
                                    {item.titulo}
                                </div>

                                <div className="history-time">
                                    {item.hora}
                                </div>

                            </div>

                        ))
                    }

                </div>

            </div>

            <div className="ia2-panel">

                <h3>Atalhos</h3>

                <div className="shortcut-grid">

                    <button>
                        👷 Hoje
                    </button>

                    <button>
                        📅 Amanhã
                    </button>

                    <button>
                        📊 Ranking
                    </button>

                    <button>
                        🎂 Aniversários
                    </button>

                </div>

            </div>

        </aside>

    );

}

export default HistoryPanel;