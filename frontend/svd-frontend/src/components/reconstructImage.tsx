import { useEffect, useRef } from "react";
import { useSvdStore, type Svd } from "../state/context";
import init, { reconstruct } from "../../../../svd_lib/pkg/svd_lib.js";

let workersInitialized = false;
const workers: Record<string, Worker> = {};
let wasmInitialized = false;

async function reconstructMatrixWithWorkers(svds: Record<string, Svd>, rank: number, width: number, height: number): Promise<ImageData>{
    
    const promises = (["red", "green", "blue"].map((channel) => {
        return new Promise<Float32Array>((resolve, reject) => {
            const worker = workers[channel];

            const onMessage = (e: MessageEvent) => {
                const { reconstructed } = e.data;
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                resolve(reconstructed);
            };

            const onError = (e: ErrorEvent) => {
                console.error(e);
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                reject(e);
            };

            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);


            const U_buffer: SharedArrayBuffer = svds[channel].U;
            const S_buffer: SharedArrayBuffer = svds[channel].S;
            const Vt_buffer: SharedArrayBuffer = svds[channel].Vt;

            worker.postMessage({ channel, U_buffer, S_buffer, Vt_buffer, width, height, rank});
           
            }); 
    }));
    const results = await Promise.all(promises);
    const output: Float32Array = reconstruct(results[0], results[1], results[2], width, height);

    const rgba = new Uint8ClampedArray(output.length);
    rgba.set(output);  

    return new ImageData(rgba, width, height);  
}

async function initialize(){
    if (!wasmInitialized) {
            await init({module_or_path: "/svd_lib_bg.wasm"});
            wasmInitialized = true;
        }
        
    if (!workersInitialized) {
        workers.red = new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" });
        workers.green = new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" });
        workers.blue = new Worker(new URL("../workers/channelWorker.ts", import.meta.url), { type: "module" });
        workersInitialized = true;
    }
}

function ReconstructImage(){
    const { R, G, B, height, width, rank } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        initialize();
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
            const offsetX = (canvas.width - width) / 2;
            const offsetY = (canvas.height - height) / 2;
            ctx.drawImage(offCanvas, offsetX, offsetY);
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