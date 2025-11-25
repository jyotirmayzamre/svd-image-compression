export default function reconstructChannel(
    svd: { U: number[][], S: number[], Vt: number[][]},
    rank: number,
): Float32Array {
    const m = svd.U.length;
    const n = svd.Vt[0].length;

    const US = new Float32Array(m * rank);
    for (let i = 0; i < m; i++) {
        const rowOffset = i * rank;
        const Urow = svd.U[i];
        for (let j = 0; j < rank; j++) {
            US[rowOffset + j] = Urow[j] * svd.S[j];
        }
    }

    const result = new Float32Array(m * n);
    
    for (let i = 0; i < m; i++) {
        const usRowOffset = i * rank;
        const resultRowOffset = i * n;
        
        for (let j = 0; j < n; j++) {
            let sum = 0;
            for (let t = 0; t < rank; t++) {
                sum += US[usRowOffset + t] * svd.Vt[t][j];
            }
            
            result[resultRowOffset + j] = Math.max(0, Math.min(255, sum));
        }
    }

    return result;
}