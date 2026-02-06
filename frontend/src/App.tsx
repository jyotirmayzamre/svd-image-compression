import RankSlider from "./components/rankSlider";
import ReconstructImage from "./components/reconstructImage";
import FileUpload from "./components/fileUpload";
import './App.css';

export default function App() {
    return (
        <main>
            <div className="p-6 font-normal font-arial flex flex-col justify-center gap-4">
                <h1 className="text-5xl">Image Compression using Singular Value Decomposition</h1>
                <h3 className="text-xl">Jyotirmay Zamre</h3>
            </div>
            {/* <ProcessImage /> */}
            <FileUpload />
            <div className="flex flex-col justify-center items-center gap-1">
                <ReconstructImage />
                <RankSlider />
            </div>
        </main>
    );
}