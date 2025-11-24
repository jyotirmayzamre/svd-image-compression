import ProcessImage from "./components/processImage";
import ReconstructImage from "./components/reconstructImage";

export default function App() {
    return (
        <div style={{ padding: 20 }}>
            <h1>SVD Image Compression</h1>

            <ProcessImage />

            <ReconstructImage />

        </div>
    );
}