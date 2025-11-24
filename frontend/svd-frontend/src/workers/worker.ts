self.onmessage = async (event: MessageEvent) => {
    const { channel, matrixPayload } = event.data;

    try {
        // POST to FastAPI /svd endpoint
        const response = await fetch("http://127.0.0.1:8000/api/svd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matrixPayload),
        });

        const svd = await response.json();

        self.postMessage({
            channel,
            svd,
        });

    } catch (error) {
        console.error(error);
        self.postMessage({
            channel,
            svd: null,
        });
    }
};
