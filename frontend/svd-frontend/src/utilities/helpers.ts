export function FrobeniusNorm(
    R: SharedArrayBuffer,
    G: SharedArrayBuffer,
    B: SharedArrayBuffer,
    k: number
): number {
    const error_red = ChannelWise(R, k);
    const error_green = ChannelWise(G, k);
    const error_blue = ChannelWise(B, k);

    return Math.sqrt(error_red + error_green + error_blue);
    
}

function ChannelWise(mat: SharedArrayBuffer, k: number): number{
    const mat_u = new Float32Array(mat);

    const len = mat_u.length;
    let error = 0;
    for(let i = k; i < len; i++){
        error += mat_u[i]**2;
    }
    return error;
}