import { useEffect, useRef } from "react";
import { useSvdStore, type Svd } from "../state/context";

async function reconstructMatrixWithWorkers(svds: Record<string, Svd>, rank: number, width: number, height: number): Promise<ImageData>{
    const workers: Record<string, Worker> = {
        "red": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" }),
        "green": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" }),
        "blue": new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" })
    }

    const promises = (["red", "green", "blue"].map((channel) => {
        return new Promise<{ channel: string, reconstructed: number[][]}>((resolve) => {
            const worker = workers[channel];

            worker.onmessage = (e) => {
                const {  channel, reconstructed } = e.data;
                worker.terminate();
                resolve(({ channel, reconstructed}));
            }

            worker.postMessage({
                channel,
                svd: svds[channel],
                rank
            });
        }); 
    }));

    const results = await Promise.all(promises);
    
    const output = new Uint8ClampedArray(width * height * 4);

    let ptr = 0;
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            output[ptr++] = results[0].reconstructed[i][j]; 
            output[ptr++] = results[1].reconstructed[i][j]; 
            output[ptr++] = results[2].reconstructed[i][j]; 
            output[ptr++] = 255;                             
        }
    }

    return new ImageData(output, width, height);  
}

function ReconstructImage(){
    const { R, G, B, height, width, rank } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    

    useEffect(() => {
        async function wrapper(){
            if(!R || !G || !B) return;
            if (!canvasRef.current) return;

            const data: ImageData = await reconstructMatrixWithWorkers(
                {"red": R, "green": G, "blue": B},
                172, width, height
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