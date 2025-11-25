import { type JSX } from "react";
import { useSvdStore } from "../state/context";


async function computeAllChannelSVDs(file: File, width: number, height: number
){
    const formData = new FormData();
    formData.append('image', file);
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    const response = await fetch('http://localhost:8000/api/svd', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('SVD computation failed');
    }

    return await response.json();
}


function scaleDimensions(maxDimension = 512, width: number, height: number){
    if(width > maxDimension || height > maxDimension){
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width*scale);
        height = Math.floor(height*scale);
    }

    return { width, height};
}

function createSharedFloat32Array(data: number[]): SharedArrayBuffer {
    const sharedBuffer = new SharedArrayBuffer(data.length * Float32Array.BYTES_PER_ELEMENT);
    const view = new Float32Array(sharedBuffer);
    view.set(data);
    return sharedBuffer;
}

function ProcessImage(): JSX.Element {
    
    const { setR, setG, setB, setWidth, setHeight, setRank, resetAll } = useSvdStore();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        resetAll();

         try {
            const img = await createImageBitmap(file);
            const { width, height } = scaleDimensions(512, img.width, img.height);
            
            setWidth(width);
            setHeight(height);
            setRank(height);

            const rawSvds = await computeAllChannelSVDs(file, width, height);

            // setR({
            //     U: new Float32Array(rawSvds.red.U).buffer,
            //     S: new Float32Array(rawSvds.red.S).buffer,
            //     Vt: new Float32Array(rawSvds.red.Vt).buffer
            // });

            // setG({
            //     U: new Float32Array(rawSvds.green.U).buffer,
            //     S: new Float32Array(rawSvds.green.S).buffer,
            //     Vt: new Float32Array(rawSvds.green.Vt).buffer
            // });

            // setB({
            //     U: new Float32Array(rawSvds.blue.U).buffer,
            //     S: new Float32Array(rawSvds.blue.S).buffer,
            //     Vt: new Float32Array(rawSvds.blue.Vt).buffer
            // })

            setR({
                U: createSharedFloat32Array(rawSvds.red.U),
                S: createSharedFloat32Array(rawSvds.red.S),
                Vt: createSharedFloat32Array(rawSvds.red.Vt)
            });

            setG({
                U: createSharedFloat32Array(rawSvds.green.U),
                S: createSharedFloat32Array(rawSvds.green.S),
                Vt: createSharedFloat32Array(rawSvds.green.Vt)
            });

            setB({
                U: createSharedFloat32Array(rawSvds.blue.U),
                S: createSharedFloat32Array(rawSvds.blue.S),
                Vt: createSharedFloat32Array(rawSvds.blue.Vt)
            });

        } catch (err) {
            console.error('Error processing image:', err);
        } 

    }
    
    return (
        <div className="flex flex-col items-center m-2">
            <input accept="image/*" type="file" className="hidden" onChange={handleFile} id="file-upload"/>

            <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
            >Upload Image</label>
        </div>
    )
    
    
}

export default ProcessImage;