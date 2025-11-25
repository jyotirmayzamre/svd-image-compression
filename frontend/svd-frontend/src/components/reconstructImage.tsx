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
        async function wrapper(){
            if(!R || !G || !B) return;
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;

            const data: ImageData = await reconstructMatrixWithWorkers(
                {"red": R, "green": G, "blue": B},
                rank, width, height
            );

            const ctx = canvasRef.current.getContext("2d")!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const offCanvas = document.createElement("canvas");
            offCanvas.width = width;
            offCanvas.height = height;
            const offCtx = offCanvas.getContext("2d");
            if (!offCtx) return;

            offCtx.putImageData(data, 0, 0);


            const scale = Math.min(canvas.width / width, canvas.height / height);
            
            const drawWidth = width * scale;
            const drawHeight = height * scale;

            const offsetX = (canvas.width - drawWidth) / 2;
            const offsetY = (canvas.height - drawHeight) / 2;



            ctx.drawImage(offCanvas, offsetX, offsetY, drawWidth, drawHeight);
        }
        wrapper();
    }, [R, G, B, width, height, rank])


    return (
        <div className="flex m-3 justify-center items-center p-5 w-[1000px] h-[400px]">
            <canvas ref={canvasRef} width={700} height={400}
            className="border border-gray-300  shadow-md bg-black"
            />
            <div className="w-[300px] bg-[rgb(238,238,238)] h-[350px] shadow-md p-2 font-[Lucida] flex flex-col justify-center items-center gap-4">
                <p><span className="font-light text-gray-600 text-sm">Image Size: </span>{width} x {height}</p>
                <p><span className="font-light text-gray-600 text-sm">Total Pixels: </span>{width * height}</p>
                <p><span className="font-light text-gray-600 text-sm">Compression Ratio: </span></p>
                <p><span className="font-light text-gray-600 text-sm">Frobenius Error: </span></p>
                <p><span className="font-light text-gray-600 text-sm">PSNR (dB): </span></p>
                <p><span className="font-light text-gray-600 text-sm">Energy: </span></p>
                <p><span className="font-light text-gray-600 text-sm">#Singular Values: </span>{rank}</p>

            </div>
        </div>
    );
}  

export default ReconstructImage;