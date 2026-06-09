import "../../css/ia/DashboardHoje.css";

function DashboardHoje({ dados }) {

    return (

        <div className="ia-dashboard">

            <div className="ia-header">

                <div className="ia-avatar">
                    🤖
                </div>

                <div className="ia-header-content">

                    <div className="ia-text">

                        {dados.cabecalho?.texto}

                    </div>

                </div>

            </div>

            <div className="ia-subtitle">

                Resumo geral

            </div>

            <div className="ia-kpis">

                <div className="ia-kpi colaboradores">

                    <div className="ia-kpi-icon">
                        👥
                    </div>

                    <div>

                        <div className="ia-kpi-number">

                            {dados.indicadores.colaboradores}

                        </div>

                        <div className="ia-kpi-label">

                            Colaboradores

                        </div>

                    </div>

                </div>

                <div className="ia-kpi os">

                    <div className="ia-kpi-icon">
                        📋
                    </div>

                    <div>

                        <div className="ia-kpi-number">

                            {dados.indicadores.os}

                        </div>

                        <div className="ia-kpi-label">

                            Ordens de Serviço

                        </div>

                    </div>

                </div>

                <div className="ia-kpi empresas">

                    <div className="ia-kpi-icon">
                        🏢
                    </div>

                    <div>

                        <div className="ia-kpi-number">

                            {dados.indicadores.empresas}

                        </div>

                        <div className="ia-kpi-label">

                            Empresas

                        </div>

                    </div>

                </div>

            </div>

            <div className="ia-table-card">

                <div className="ia-table-header">

                    <span>
                        Top 5 Ordens de Serviço
                    </span>

                </div>

                <table className="ia-table">

                    <thead>

                        <tr>

                            <th>OS</th>

                            <th>Empresa</th>

                            <th>Supervisor</th>

                            <th>Colaboradores</th>

                        </tr>

                    </thead>

                    <tbody>

                        {dados.topOS?.map(
                            (
                                os,
                                index
                            ) => (

                                <tr
                                    key={index}
                                >

                                    <td>
                                        {os.os}
                                    </td>

                                    <td>
                                        {os.empresa}
                                    </td>

                                    <td>
                                        {os.supervisor}
                                    </td>

                                    <td>

                                        <div className="ia-colab-list">

                                            {
                                                os.equipe?.map(
                                                    (
                                                        colab,
                                                        index
                                                    ) => {

                                                        const imgSrc =
                                                            colab.fotoperfil

                                                                ?

                                                                `${colab.fotoperfil}?v=${colab.versao_foto || ""}`

                                                                :

                                                                "http://localhost:3000/imagens/user-default.webp";

                                                        return (

                                                            <img

                                                                key={index}

                                                                className="ia-colab-img"

                                                                src={imgSrc}

                                                                title={colab.nome}

                                                                alt={colab.nome}

                                                            />

                                                        );

                                                    }
                                                )
                                            }

                                            <span className="ia-colab-count">

                                                {
                                                    os.colaboradores
                                                }
                                            </span>

                                        </div>


                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            </div>

            {
                dados.curiosidade && (

                    <div className="ia-curiosidade">

                        💡

                        <span>

                            {dados.curiosidade}

                        </span>

                    </div>

                )
            }{
                dados.comentarioIA && (

                    <div className="ia-comentario">

                        <div className="ia-comentario-titulo">

                            🧠 Análise da IA

                        </div>

                        <div className="ia-comentario-texto">

                            {dados.comentarioIA}

                        </div>

                    </div>

                )
            }

        </div>

    );

}

export default DashboardHoje;