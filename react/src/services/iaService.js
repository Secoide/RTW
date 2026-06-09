import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000"
});

export async function perguntarIA(pergunta) {

    const response = await api.post(
        "/api/ia2/chat",
        {
            pergunta
        }
    );

    return response.data;
}