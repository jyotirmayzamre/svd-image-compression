import { useEffect, useRef } from "react";
import { useSvdStore, type Svd } from "../state/context";

async function reconstructMatrixWithWorkers(svds: Record<string, Svd>, rank: number, width: number, height: number): Promise<ImageData>{
    const workers: Record<string, Worker> = {
        "red": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" }),
        "green": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" }),
        "blue": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" })
    }

    const promises = (["red", "green", "blue"].map((channel) => {
        return new Promise<Float32Array>((resolve, reject) => {
            const worker = workers[channel];

            worker.onmessage = (e) => {
                const {  reconstructed } = e.data;
                worker.terminate();
                resolve(reconstructed);
            }

            worker.onerror = (e) => {
                worker.terminate();
                reject(e);
            }

            worker.postMessage({
                channel,
                svd: svds[channel],
                rank
            });
        }); 
    }));

    const results = await Promise.all(promises);
    
    const totalPixels = width*height;
    const output = new Uint8ClampedArray(totalPixels * 4);

    for(let i = 0; i < totalPixels; i++){
        const idx = i*4;
        output[idx] = results[0][i];
        output[idx+1] = results[1][i];
        output[idx+2] = results[2][i];
        output[idx+3] = 255;
    }

    return new ImageData(output, width, height);  
}

function ReconstructImage(){
    const { R, G, B, height, width, rank } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    
    useEffect(() => {
        if (R && G && B) {
            console.log("R.U[0][0]:", R.U[0]?.[0]);
            console.log("G.U[0][0]:", G.U[0]?.[0]);
            console.log("B.U[0][0]:", B.U[0]?.[0]);
        }
        async function wrapper(){
            if(!R || !G || !B) return;
            if (!canvasRef.current) return;

            const data: ImageData = await reconstructMatrixWithWorkers(
                {"red": R, "green": G, "blue": B},
                rank, width, height
            );

            const ctx = canvasRef.current.getContext("2d")!;
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            ctx.putImageData(data, 0, 0);
        }
        wrapper();
    }, [R, G, B, width, height, rank])


    return (
        <div style={{ marginTop: "20px" }}>
            <h1>Reconstructed</h1>
            <canvas ref={canvasRef} />
        </div>
    );
}  

export default ReconstructImage;