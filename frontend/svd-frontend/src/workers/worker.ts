import api from "../services/api";

self.onmessage = async (event) => {
    const { matrixPayload, channelName } = event.data;

    try {
        const response = await api.post(JSON.stringify(matrixPayload))
        self.postMessage({ channelName, response});
    } catch(err){
        self.postMessage({ channelName, error: err})
    }
}