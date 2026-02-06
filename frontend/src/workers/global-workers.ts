const redWorker = new Worker(new URL("./svdWorker.ts", import.meta.url), { type: "module" });
const greenWorker = new Worker(new URL("./svdWorker.ts", import.meta.url), { type: "module" });
const blueWorker = new Worker(new URL("./svdWorker.ts", import.meta.url), { type: "module" });

export type Channel = 'red' | 'green' | 'blue';

const workers: Record<Channel, Worker> = {
    'red': redWorker,
    'green': greenWorker,
    'blue': blueWorker
}

export default workers;