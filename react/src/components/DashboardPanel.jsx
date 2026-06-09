function DashboardPanel() {

    return (

        <aside className="ia2-dashboard">

            <div className="ia2-panel">

                <h3>
                    Dashboard do Dia
                </h3>

                <div className="kpi-list">

                    <div className="kpi-card">

                        <span>
                            👷
                        </span>

                        <div>

                            <h2>18</h2>

                            <small>
                                Colaboradores
                            </small>

                        </div>

                    </div>

                    <div className="kpi-card">

                        <span>
                            📋
                        </span>

                        <div>

                            <h2>7</h2>

                            <small>
                                OS Hoje
                            </small>

                        </div>

                    </div>

                    <div className="kpi-card">

                        <span>
                            🟢
                        </span>

                        <div>

                            <h2>12</h2>

                            <small>
                                Disponíveis
                            </small>

                        </div>

                    </div>

                </div>

            </div>

            <div className="ia2-panel">

                <h3>
                    Alertas IA
                </h3>

                <div className="alert-list">

                    <div className="alert-item">
                        ⚠️ 2 exames vencidos
                    </div>

                    <div className="alert-item">
                        🩺 5 exames próximos
                    </div>

                    <div className="alert-item">
                        🎂 2 aniversariantes
                    </div>

                </div>

            </div>

            <div className="ia2-panel">

                <h3>
                    Sistema
                </h3>

                <div className="version-info">

                    <div>
                        Versão
                        <strong>
                            v2.3.14
                        </strong>
                    </div>

                    <div>
                        Status
                        <strong>
                            Online
                        </strong>
                    </div>

                </div>

            </div>

        </aside>

    );

}

export default DashboardPanel;