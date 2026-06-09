import "../css/ia/ia2.css";

import HistoryPanel
from "../components/HistoryPanel";

import DashboardPanel
from "../components/DashboardPanel";

import ChatArea
from "../components/ChatArea";

function IA2() {

    return (

        <div className="ia2-wrapper">

            <HistoryPanel />

            <ChatArea />

            <DashboardPanel />

        </div>

    );

}

export default IA2;