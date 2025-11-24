import { useEffect, useRef } from "react";
import { useSvdStore } from "../state/context";

export default function ReconstructImage() {
    const { R, G, B, rank } = useSvdStore();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!R.svd || !G.svd || !B.svd) return; // wait for SVD
        if (!canvasRef.current) return;

        const { rows, cols } = R.matrix!;
        const ctx = canvasRef.current.getContext("2d")!;
        canvasRef.current.width = cols;
        canvasRef.current.height = rows;

        const imageData = ctx.createImageData(cols, rows);
        const data = imageData.data;

        const channels = {
            R: reconstructChannel(R.svd, rank, rows, cols),
            G: reconstructChannel(G.svd, rank, rows, cols),
            B: reconstructChannel(B.svd, rank, rows, cols),
        };

        let idx = 0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {

                data[idx] = channels.R[y][x];
                data[idx + 1] = channels.G[y][x];
                data[idx + 2] = channels.B[y][x];
                data[idx + 3] = 255;

                idx += 4;
            }
        }

        ctx.putImageData(imageData, 0, 0);

    }, [rank, R.svd, G.svd, B.svd, R.matrix]);

    return (
        <div style={{ marginTop: "20px" }}>
            <canvas ref={canvasRef} />
        </div>
    );
}


function reconstructChannel(
    svd: { U: number[][]; S: number[][]; Vt: number[][] },
    rank: number,
    rows: number,
    cols: number
): number[][] {

    const k = Math.min(rank, svd.S.length);

    const out: number[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(0)
    );

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            let sum = 0;

            for (let i = 0; i < k; i++) {
                sum += svd.U[r][i] * svd.S[i][i] * svd.Vt[i][c];
            }

            out[r][c] = Math.min(255, Math.max(0, sum)); 
        }
    }

    return out;
}

