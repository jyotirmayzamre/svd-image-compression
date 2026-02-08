import { useEffect, useRef, useState, useCallback } from "react";
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

type Props = {
  fullImageRef: React.RefObject<ImageData | null>;
};


function ReconstructImage({ fullImageRef }: Props){
    const { height, width, rank, dataReady } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const [hovered, setHovered] = useState<boolean>(false);

    const drawImage = useCallback((ref: React.RefObject<HTMLCanvasElement | null>, data: ImageData) => {
        const canvas = ref.current;

        if(!canvas) return;
        const ctx = canvas.getContext("2d")!;

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
    }, [height, width]);


    useEffect(() => {
        if (width === 0 || height === 0 || rank === 0 || !dataReady) return;
        async function wrapper(){
            initializeWASM();
            const data: ImageData = await reconstructMatrix(width, height, rank);

            //set full image SVD for overlay drawing
            if(!fullImageRef.current && rank == Math.min(width, height)){
                fullImageRef.current = data;
            }

            drawImage(canvasRef, data);
        }
        wrapper() 
    }, [width, height, rank, dataReady, drawImage, fullImageRef])


    useEffect(() => {
        if(!hovered || !fullImageRef.current) return;
        drawImage(overlayRef, fullImageRef.current);
    }, [drawImage, hovered, fullImageRef])

    const clearOverlay = () => {
        const canvas = overlayRef.current;
        if(!canvas) return;
        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    };


    return (
        <div className="flex m-3 justify-center items-center p-5 w-[1000px] h-[400px]">
            <div className="relative w-[700px] h-[400px]">
                <canvas ref={overlayRef} width={700} height={400} 
                    className="absolute inset-0 border border-gray-300 shadow-md z-20"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => {
                        setHovered(false);
                        clearOverlay();
                    }}
                />
                <canvas ref={canvasRef} width={700} height={400}
                    className="absolute inset-0 border border-gray-300  shadow-md bg-black z-10"
                />
            </div>
            
            <div className="w-[300px] bg-[rgb(238,238,238)] h-[350px] shadow-md p-2 font-[Lucida] flex flex-col justify-center items-center gap-4">
                <p><span className="font-light text-gray-600 text-sm">Image Size: </span>{width} x {height}</p>
                <p><span className="font-light text-gray-600 text-sm">Total Pixels: </span>{width * height}</p>
                <p><span className="font-light text-gray-600 text-sm">Compression Ratio: </span>
                {rank ? ((width * height) / (rank*(width + height + 1))).toFixed(2) : 0}</p>
                <p><span className="font-light text-gray-600 text-sm">#Singular Values: </span>{rank}</p>
                <p><span className="font-light text-gray-600 text-sm">hover for the original picture</span></p>

            </div>
        </div>
    );
}  

export default ReconstructImage;