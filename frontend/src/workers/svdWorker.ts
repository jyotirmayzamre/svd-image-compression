/// <reference lib="webworker" />


import { reconstruct_channel } from 'svd_lib';

let storedSVD: {
    channel: string,
    U: Float32Array,
    S: Float32Array,
    Vt: Float32Array,
    width: number,
    height: number,
} | null = null;


self.onmessage = async(event: MessageEvent) => {
    const { type } = event.data;

    if(type == 'upload'){
        const { U_buffer, S_buffer, Vt_buffer, width, height, channel} = event.data;

        storedSVD = {
            channel,
            U: new Float32Array(U_buffer),
            S: new Float32Array(S_buffer),
            Vt: new Float32Array(Vt_buffer),
            width,
            height,
        };

        self.postMessage({ type: 'uploaded', channel: event.data.channel })
    }

    else if (type == 'reconstruct'){
        const { rank } = event.data;
        if(!storedSVD){
            self.postMessage({ message: 'SVD for this channel does not exist' });
            return
        }
        try {
            const reconstructed = reconstruct_channel(
                storedSVD['U'],
                storedSVD['S'],
                storedSVD['Vt'],
                storedSVD['width'],
                storedSVD['height'],
                rank
            )
            const channel = storedSVD['channel'];
            self.postMessage({ type: 'reconstructed', channel, reconstructed }, [reconstructed.buffer]);
        } catch(e){
            console.error(e);
        }
    }
}