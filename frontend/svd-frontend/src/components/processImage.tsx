import { type JSX } from "react";
import { useSvdStore, type Channel, type Matrix, type SvdResult } from "../state/context";

function ProcessImage(): JSX.Element {
    
    const { R, G, B, resetAll } = useSvdStore();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        resetAll();

        const img = await loadImage(file);

        const { width, height, ctx } = drawToCanvas(img);

        const imageData = ctx.getImageData(0, 0, width, height).data;

        const { Rmat, Gmat, Bmat } = extractMatrices(imageData, width, height);

        R.setMatrix(Rmat);
        G.setMatrix(Gmat);
        B.setMatrix(Bmat);

        const svds = await computeSVDWithWorkers(Rmat, Gmat, Bmat);

        R.setSvd(svds.R);
        G.setSvd(svds.G);
        B.setSvd(svds.B);

        console.log("Matrices stored");
    }
    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFile} />
        </div>
    )
    
    
}


function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        const img = new Image();

        reader.onload = () => {
            img.src = reader.result as string;
            img.onload = () => resolve(img);
        };

        reader.readAsDataURL(file);
    })
}

function drawToCanvas(img: HTMLImageElement){
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d")!;
    return { width: img.width, height: img.height, ctx };
}


function extractMatrices(
    data: Uint8ClampedArray,
    width: number,
    height: number
) {
    const Rmat: number[][] = [];
    const Gmat: number[][] = [];
    const Bmat: number[][] = [];

    for (let y = 0; y < height; y++) {
        const rowR: number[] = [];
        const rowG: number[] = [];
        const rowB: number[] = [];

        for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        rowR.push(data[i]);  
        rowG.push(data[i + 1]); 
        rowB.push(data[i + 2]); 
        }

        Rmat.push(rowR);
        Gmat.push(rowG);
        Bmat.push(rowB);
    }

    return {
        Rmat: { rows: height, cols: width, data: Rmat },
        Gmat: { rows: height, cols: width, data: Gmat },
        Bmat: { rows: height, cols: width, data: Bmat },
    };
}




async function computeSVDWithWorkers(
    R: Matrix,
    G: Matrix,
    B: Matrix
): Promise<Record<Channel, SvdResult>> {

    const matrices: Record<Channel, Matrix> = { R, G, B };

    const workers: Record<Channel, Worker> = {
        R: new Worker(new URL("./workers/worker.ts", import.meta.url)),
        G: new Worker(new URL("./workers/worker.ts", import.meta.url)),
        B: new Worker(new URL("./workers/worker.ts", import.meta.url))
    };

    const promises = (["R", "G", "B"] as Channel[]).map((channel) => {
        return new Promise<{ channel: Channel; svd: SvdResult }>((resolve) => {
            const worker = workers[channel];

            worker.onmessage = (e) => {
                const { channel, svd } = e.data;
                worker.terminate();
                resolve({ channel, svd });
            };

            worker.postMessage({
                channel,
                matrix: matrices[channel]
            });
        });
    });

    const results = await Promise.all(promises);

    const output: Record<Channel, SvdResult> = {
        R: results.find((r) => r.channel === "R")!.svd,
        G: results.find((r) => r.channel === "G")!.svd,
        B: results.find((r) => r.channel === "B")!.svd,
    };

    return output;
}

export default ProcessImage;