import { type JSX } from "react";
import sendErrorNotif from "../utils";
import workers, { type Channel } from "../workers/global-workers";
import { useSvdStore } from "../state/context";

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/web'];

function isFileOfCorrectType(file: File): boolean {
    return ALLOWED_TYPES.includes(file.type);
}


const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;

function getScaledDim(file: File): Promise<[number, number]>{
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
            const newWidth = Math.floor(img.width * scale);
            const newHeight = Math.floor(img.height * scale);
            URL.revokeObjectURL(url);
            resolve([newWidth, newHeight]);
        }
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Image failed to load"));
        };
        img.src = url;
    })
    
}


//Scale uploaded image to fit within fixed canvas dimensions
function scaleFile(file: File, width: number, height: number): Promise<File> {

    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');

            if(!ctx){
                reject(new Error('Canvas context not available'));
                sendErrorNotif('Error in scaling image')
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if(!blob){
                    reject(new Error('Failed to create blob'));
                    sendErrorNotif('Error in scaling image')
                    return;
                }


                resolve(new File([blob], file.name));
            }, file.type);

            URL.revokeObjectURL(url);
        }

        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = url;
    })

}

interface SVD {
    U: Float32Array<ArrayBuffer>,
    S: Float32Array<ArrayBuffer>,
    Vt: Float32Array<ArrayBuffer>
}

//Parse binary response body using matrix size as offsets
function parseResponseData(buffer: ArrayBuffer, width: number, height: number){
    const rank = Math.min(height, width);
    const U_size = height * rank;
    const S_size = rank;
    const Vt_size = rank * width;

    let offset = 0;

    function readFloat32Array(length: number){
        const arr = new Float32Array(buffer, offset, length);
        offset += length * 4;
        return arr.slice();
    }

    const svdData: Record<Channel, SVD> = {
        red: {
            U: readFloat32Array(U_size),
            S: readFloat32Array(S_size),
            Vt: readFloat32Array(Vt_size)
        },
        green: {
            U: readFloat32Array(U_size),
            S: readFloat32Array(S_size),
            Vt: readFloat32Array(Vt_size)
        },
        blue: {
            U: readFloat32Array(U_size),
            S: readFloat32Array(S_size),
            Vt: readFloat32Array(Vt_size)
        }
    }


    return svdData;
}


const channels: Channel[] = ['red', 'green', 'blue']

async function transferDataToWorkers(data: Record<Channel, SVD>, width: number, height: number): Promise<void> {
    const promises = (channels.map((channel) => {
        return new Promise<void>((resolve, reject) => {
            const worker = workers[channel];

            const onMessage = (e: MessageEvent) => {
                if (e.data.type === 'uploaded' && e.data.channel === channel) {
                    worker.removeEventListener('message', onMessage);
                    worker.removeEventListener('error', onError);
                    resolve();
                }
            };

            const onError = (e: ErrorEvent) => {
                console.error(e);
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                reject(e);
            }

            worker.addEventListener('message', onMessage)
            worker.addEventListener('error', onError);

            worker.postMessage({
                type: 'upload',
                U_buffer: data[channel].U.buffer,
                S_buffer: data[channel].S.buffer,
                Vt_buffer: data[channel].Vt.buffer,
                width,
                height,
                channel
            }, [
                data[channel].U.buffer,
                data[channel].S.buffer,
                data[channel].Vt.buffer
            ]);


        })


    }))

    await Promise.all(promises);
    console.log('All SVD data uploaded to workers');
}


async function getSVD(file: File): Promise<ArrayBuffer>{
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:8000/api/svd', {
        method: 'POST',
        body: formData
    });

    if(!response.ok){
        throw new Error('SVD computation failed');
    }

    const buffer = await response.arrayBuffer();
    return buffer;
}


function FileUpload({ onResetFullImage }: { onResetFullImage: () => void }): JSX.Element {

    const { setHeight, setWidth, setRank, setDataReady } = useSvdStore();

    const handleFileUpload = async(e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        if(!isFileOfCorrectType(file)){
            sendErrorNotif('Wrong file type');
            return
        }

        try {
            onResetFullImage();
            setDataReady(false);
            const [width, height] = await getScaledDim(file);
            setWidth(width);
            setHeight(height);
            setRank(Math.min(width, height));
            const scaledFile = await scaleFile(file, width, height);
            const buffer = await getSVD(scaledFile);
            const data = parseResponseData(buffer, width, height);
            await transferDataToWorkers(data, width, height);
            setDataReady(true);
        } catch(e){
            console.error(e);
        }
    }

    return (
        <div className="flex flex-col items-center m-2">
            <input accept="image/*" type="file" className="hidden" onChange={handleFileUpload} id="file-upload"/>

            <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
            >Upload Image</label>
        </div>
    )

}

export default FileUpload;



