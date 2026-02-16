import { useEffect, useRef, useState, useCallback } from "react";
import { useSvdStore } from "../state/context";
import { reconstruct } from "../../../svd_lib/pkg/svd_lib.js";
import workers, { type Channel } from "../workers/global-workers.js";


const channels: Channel[] = ['red', 'green', 'blue'];


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



function computeMSE(a: ImageData, b: ImageData): number {
    const d1 = a.data;
    const d2 = b.data;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < d1.length; i += 4) {
        for (let c = 0; c < 3; c++) {
        const diff = d1[i + c] - d2[i + c];
        sum += diff * diff;
        count++;
        }
    }

    return sum / count;    
}

function computePSNR(a: ImageData, b: ImageData){
    const mse = computeMSE(a, b);
    if(mse === 0) return Infinity

    const MAX = 255;
    return 20 * Math.log10(MAX) - 10 * Math.log10(mse);
}

type Props = {
  fullImageRef: React.RefObject<ImageData | null>;
};


function ReconstructImage({ fullImageRef }: Props){
    const { height, width, rank, dataReady } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const [psnr, setPsnr] = useState<number>(Infinity);
    const [hovered, setHovered] = useState<boolean>(false);
    const [wipeX, setWipeX] = useState<number>(0);

    const drawImage = useCallback((ref: React.RefObject<HTMLCanvasElement | null>, 
        data: ImageData, clipRatio?: number) => {
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
        ctx.save()
        
        let clipWidth = width;
        if(clipRatio){
            clipWidth = width * clipRatio;
            ctx.beginPath();
            ctx.rect(offsetX, offsetY, clipWidth, height);
            ctx.clip();
        }
        ctx.drawImage(offCanvas, offsetX, offsetY);
        ctx.restore();

        const lineX = offsetX + clipWidth;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; 
        ctx.lineWidth = 2;
        ctx.moveTo(lineX, offsetY);
        ctx.lineTo(lineX, offsetY + height);
        ctx.stroke();
    }, [height, width]);


    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayRef.current;
        if(!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / canvas.width));
        setWipeX(ratio);
    }


    useEffect(() => {
        if (width === 0 || height === 0 || rank === 0 || !dataReady) return;

        async function wrapper(){
            const data: ImageData = await reconstructMatrix(width, height, rank);
            
            //set full image SVD for overlay drawing
            if(!fullImageRef.current && rank == Math.min(width, height)){
                fullImageRef.current = data;
            }

            setPsnr(computePSNR(data, fullImageRef.current!))

            drawImage(canvasRef, data);
        }

        wrapper() 
    }, [width, height, rank, dataReady, drawImage, fullImageRef])


    useEffect(() => {
        if(!hovered || !fullImageRef.current) return;
        drawImage(overlayRef, fullImageRef.current, wipeX);
    }, [drawImage, hovered, fullImageRef, wipeX])

  
    return (
        <div className="flex m-3 justify-center items-center p-5 w-[1000px] h-[400px]">
            <div className="relative w-[700px] h-[400px]">
                <canvas ref={overlayRef} width={700} height={400} 
                    className="absolute inset-0 border border-gray-300 shadow-md z-20"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => {
                        setHovered(false);
                        setWipeX(0);
                    }}
                    onMouseMove={handleMouseMove}
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
                <p><span className="font-light text-gray-600 text-sm">PSNR: </span>{psnr.toFixed(2)} dB</p>
                <p><span className="font-light text-gray-600 text-sm">#Singular Values: </span>{rank}</p>
                
                <p><span className="font-light text-gray-600 text-sm">hover across for comparison</span></p>

            </div>
        </div>
    );
}  

export default ReconstructImage;