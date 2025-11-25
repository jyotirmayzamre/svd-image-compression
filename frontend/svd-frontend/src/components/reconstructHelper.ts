// export default function reconstructChannel(
//     svd: { U: number[][], S: number[], Vt: number[][]},
//     rank: number,
// ): number[][]{
//     const m = svd.U.length;
//     const n = svd.Vt[0].length;

//     const Uk = svd.U.map(row => row.slice(0, rank));
//     const Sk = svd.S.slice(0, rank);
//     const Vtk = svd.Vt.slice(0, rank);

//     const US = Array.from({ length: m }, () => Array(rank).fill(0));
//     for (let i = 0; i < m; i++) {
//         for (let j = 0; j < rank; j++) {
//             US[i][j] = Uk[i][j] * Sk[j];
//         }
//     }

//     const A = Array.from({ length: m }, () => Array(n).fill(0));

//     for (let i = 0; i < m; i++) {
//         for (let j = 0; j < n; j++) {
//             let sum = 0;
//             for (let t = 0; t < rank; t++) {
//                 sum += US[i][t] * Vtk[t][j];
//             }
//             A[i][j] = sum;
//         }
//     }
//     return A;
// }

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