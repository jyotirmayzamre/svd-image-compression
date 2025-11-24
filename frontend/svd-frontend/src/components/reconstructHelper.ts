export default function reconstructChannel(
    svd: { U: number[][], S: number[], Vt: number[][]},
    rank: number,
): number[][]{
    const m = svd.U.length;
    const n = svd.Vt[0].length;

    const Uk = svd.U.map(row => row.slice(0, rank));
    const Sk = svd.S.slice(0, rank);
    const Vtk = svd.Vt.slice(0, rank);

    const US = Array.from({ length: m }, () => Array(rank).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < rank; j++) {
            US[i][j] = Uk[i][j] * Sk[j];
        }
    }

    const A = Array.from({ length: m }, () => Array(n).fill(0));

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            let sum = 0;
            for (let t = 0; t < rank; t++) {
                sum += US[i][t] * Vtk[t][j];
            }
            A[i][j] = sum;
        }
    }
    return A;
}