import RankSlider from "./components/rankSlider";
import ReconstructImage from "./components/reconstructImage";
import FileUpload from "./components/fileUpload";
import './App.css';
import { useRef } from "react";


export default function App() {
    const fullImageRef = useRef<ImageData | null>(null);
    return (
        <main>
            <div className="p-6 font-normal font-arial flex flex-col justify-center gap-2">
                <h1 className="text-4xl">Image Compression using Singular Value Decomposition</h1>
                <h3 className="text-md">Jyotirmay Zamre</h3>
            </div>
            <FileUpload onResetFullImage={() => {
                fullImageRef.current = null;
            }}/>
            <div className="flex flex-col justify-center items-center gap-1">
                <ReconstructImage fullImageRef={fullImageRef}/>
                <RankSlider />
            </div>
        </main>
    );
}