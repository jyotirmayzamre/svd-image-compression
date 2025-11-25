import { type JSX } from "react";
import { useSvdStore, type Svd } from "../state/context";


async function computeAllChannelSVDs(file: File, width: number, height: number
): Promise<{ red: Svd; green: Svd; blue: Svd }> {
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

            const svds = await computeAllChannelSVDs(file, width, height);

            setR(svds.red);
            setG(svds.green);
            setB(svds.blue);
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