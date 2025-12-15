import { type JSX } from "react";
import { useSvdStore } from "../state/context";

//Sends request with the entire image matrix to backend
async function computeAllChannelSVDs(file: File){
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:8000/api/svd', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('SVD computation failed');
    }

    return await response.json();
}


//Creates a SharedArrayBuffer out of a regular array
function createSharedFloat32Array(data: number[]): SharedArrayBuffer {
    const sharedBuffer = new SharedArrayBuffer(data.length * Float32Array.BYTES_PER_ELEMENT);
    const view = new Float32Array(sharedBuffer);
    view.set(data);
    return sharedBuffer;
}

function ProcessImage(): JSX.Element {
    
    const { setR, setG, setB, setWidth, setHeight, setRank, resetAll } = useSvdStore();

    //Obtains the SVDs of the channels and sets it
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        resetAll();

        try {
            const rawSvds = await computeAllChannelSVDs(file);

            setWidth(rawSvds.width);
            setHeight(rawSvds.height);
            setRank(rawSvds.height);

            const [rData, gData, bData] = await Promise.all([
                Promise.resolve({
                    U: createSharedFloat32Array(rawSvds.red.U),
                    S: createSharedFloat32Array(rawSvds.red.S),
                    Vt: createSharedFloat32Array(rawSvds.red.Vt)
                }),
                Promise.resolve({
                    U: createSharedFloat32Array(rawSvds.green.U),
                    S: createSharedFloat32Array(rawSvds.green.S),
                    Vt: createSharedFloat32Array(rawSvds.green.Vt)
                }),
                Promise.resolve({
                    U: createSharedFloat32Array(rawSvds.blue.U),
                    S: createSharedFloat32Array(rawSvds.blue.S),
                    Vt: createSharedFloat32Array(rawSvds.blue.Vt)
                })
            ]);

            setR(rData);
            setG(gData);
            setB(bData);


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