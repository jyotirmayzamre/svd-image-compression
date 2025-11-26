import init, { reconstruct_channel } from '../../../../svd_lib/pkg/svd_lib.js';

let wasmInitialized = false;

self.onmessage = async (event: MessageEvent) => {
    if (!wasmInitialized) {
        await init({module_or_path: "/svd_lib_bg.wasm"});
        wasmInitialized = true;
    }
    const { channel, U_buffer, S_buffer, Vt_buffer, width, height, rank } = event.data;

    const U = new Float32Array(U_buffer).slice(0);
    const S = new Float32Array(S_buffer).slice(0);
    const Vt = new Float32Array(Vt_buffer).slice(0);
    
    try{
        const reconstructed = reconstruct_channel(U, S, Vt, width, height, rank);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        self.postMessage({ channel, reconstructed },[reconstructed.buffer]);
    } catch(e){
        console.error(e);
    }
    

}