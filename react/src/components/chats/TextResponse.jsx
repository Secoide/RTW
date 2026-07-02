import "../../css/ia/TextResponse.css";

function TextResponse({ mensagem }) {

    return (

        <div className="ia-text-response">

            <div className="ia-text-header">

                <div className="ia-text-avatar">
                    🤖
                </div>

                <div className="ia-text-title">
                    IA ConnectPear
                </div>

            </div>

            <div className="ia-text-body">

                {mensagem}

            </div>

        </div>

    );

}

export default TextResponse;