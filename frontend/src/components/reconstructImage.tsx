import { useEffect, useRef } from "react";
import { useSvdStore } from "../state/context";
import init, { reconstruct } from "../../../svd_lib/pkg/svd_lib.js";
import workers, { type Channel } from "../workers/global-workers.js";


const channels: Channel[] = ['red', 'green', 'blue'];
let wasmInitialized = false;


async function reconstructMatrix(width: number, height: number, rank: number): Promise<ImageData>{
    const promises = (channels.map((channel) => {
        return new Promise<Float32Array>((resolve, reject) => {
            const worker = workers[channel];

            const onMessage = (e: MessageEvent) => {
                if (e.data.type === 'reconstructed' && e.data.channel == channel) {
                    const { reconstructed } = e.data;
                    worker.removeEventListener('message', onMessage);
                    worker.removeEventListener('error', onError);
                    resolve(reconstructed);
                };
            }
                

            const onError = (e: ErrorEvent) => {
                console.error(e);
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                reject(e);
            };

            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);


            worker.postMessage({ type: 'reconstruct', rank });
           
            }); 
    }));
    const results = await Promise.all(promises);

    const output: Float32Array = reconstruct(results[0], results[1], results[2], width, height);

    const rgba = new Uint8ClampedArray(output.length);
    rgba.set(output);  

    return new ImageData(rgba, width, height);  
}



async function initializeWASM(){
    if (!wasmInitialized){
        await init({module_or_path: "/svd_lib_bg.wasm"});
        wasmInitialized = true;
    }
}


function ReconstructImage(){
    const { height, width, rank, dataReady } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        if (width === 0 || height === 0 || rank === 0 || !dataReady) return;
        initializeWASM();
        async function wrapper(){
            if (!canvasRef.current) return;

            const data: ImageData = await reconstructMatrix(width, height, rank);
            const canvas = canvasRef.current;
            if(!canvas) return;

            const ctx = canvas.getContext("2d", {
                alpha: false,
                desynchronized: true
            })!;

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
    }, [width, height, rank, dataReady])


    return (
        <div className="flex m-3 justify-center items-center p-5 w-[1000px] h-[400px]">
            <canvas ref={canvasRef} width={700} height={400}
            className="border border-gray-300  shadow-md bg-black"
            />
            <div className="w-[300px] bg-[rgb(238,238,238)] h-[350px] shadow-md p-2 font-[Lucida] flex flex-col justify-center items-center gap-4">
                <p><span className="font-light text-gray-600 text-sm">Image Size: </span>{width} x {height}</p>
                <p><span className="font-light text-gray-600 text-sm">Total Pixels: </span>{width * height}</p>
                <p><span className="font-light text-gray-600 text-sm">Compression Ratio: </span>
                {rank ? ((width * height) / (rank*(width + height + 1))).toFixed(2) : 0}</p>
                <p><span className="font-light text-gray-600 text-sm">#Singular Values: </span>{rank}</p>

            </div>
        </div>
    );
}  

export default ReconstructImage;