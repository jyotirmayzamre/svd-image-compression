import reconstructChannel from "../components/reconstructHelper";

self.onmessage = (event: MessageEvent) => {
    const { channel, svd, rank } = event.data;
    const reconstructed = reconstructChannel(svd, rank);
    self.postMessage({
        channel, reconstructed
    })
}