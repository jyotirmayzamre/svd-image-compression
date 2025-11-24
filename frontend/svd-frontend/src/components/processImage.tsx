import { type JSX } from "react";
import { useSvdStore, type Svd } from "../state/context";

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = URL.createObjectURL(file);
    })
}

function getImageData(img: HTMLImageElement){
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, img.width, img.height).data;

    return extractMatrices(data, img.width, img.height);
}


function extractMatrices(
    data: Uint8ClampedArray,
    width: number,
    height: number
) {

    const size = width * height;
    const red: number[] = [];
    const green: number[] = [];
    const blue: number[] = [];

    for (let i = 0; i < size; i++){
        const index = i * 4;
        red[i] = data[index];
        green[i] = data[index+1];
        blue[i] = data[index+2];
    }

    return {
        "red": red,
        "green": green ,
        "blue": blue ,
    };
}

async function computeSVDWithWorkers(matrices: Record<string, number[]>, width: number, height: number): Promise<void> {//Promise<Record<string, Svd>> {
    const workers: Record<string, Worker> = {
        "red": new Worker(new URL("../workers/worker.ts", import.meta.url), { type: "module" }),
        "green": new Worker(new URL("../workers/worker.ts", import.meta.url), { type: "module" }),
        "blue": new Worker(new URL("../workers/worker.ts", import.meta.url), { type: "module" })
    };

    const promises = (["red", "green", "blue"].map((channel) => {
        return new Promise<{ channel: string, svd: Svd }>((resolve) => {
            const worker = workers[channel];

            worker.onmessage = (e) => {
                const { channel, svd } = e.data;
                worker.terminate();
                resolve({ channel, svd });
            }

            worker.postMessage({
                channel,
                matrixPayload:{ width, height, data: matrices[channel] }
            });
        });
        
    }));

   const results = await Promise.all(promises);
   console.log(results);
}

function ProcessImage(): JSX.Element {
    
    const { setWidth, setHeight, resetAll } = useSvdStore();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        resetAll();

        //getHTMLImageElement from file
        const img = await loadImage(file);
        setWidth(img.width);
        setHeight(img.height);

        //get channel data 
        const { red, green, blue } = getImageData(img);

        //get SVDs for each channel
        computeSVDWithWorkers({"red": red, "green": green, "blue": blue}, img.width, img.height);

        
    }
    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFile} />
        </div>
    )
    
    
}

export default ProcessImage;