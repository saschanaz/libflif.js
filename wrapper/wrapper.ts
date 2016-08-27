namespace libflif {
    interface libflifWorkerMessageData {
        uuid: string;
        error: Error;
        result: ArrayBuffer;
    }
    interface libflifWorkerMessageEvent extends MessageEvent {
        data: libflifWorkerMessageData;
    }

    namespace UUID {
        function uuid16() {
            return (Math.random() * 0xFFFF | 0).toString(16)
        }

        export function generate() {
            return `${uuid16()}${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}${uuid16()}${uuid16()}`;
        }
    }
    let worker: Worker;

    export function startWorker(path?: string) {
        if (worker) {
            return;
        }
        if (path) {
            worker = new Worker(`${path}/worker.js`);
            return;
        }
        worker = new Worker("worker.js");
    }

    export function decode(input: ArrayBuffer | Blob) {
        return sendMessage("decode", input);
    }

    export function encode(input: ArrayBuffer | Blob) {
        return sendMessage("encode", input);
    }

    async function sendMessage(type: "decode" | "encode", input: ArrayBuffer | Blob) {
        startWorker();

        const arrayBuffer = input instanceof Blob ? await convertToArrayBuffer(input) : input;

        return new Promise<ArrayBuffer>((resolve, reject) => {
            const uuid = UUID.generate();
            const listener = (ev: libflifWorkerMessageEvent) => {
                if (ev.data.uuid !== uuid) {
                    return;
                }
                worker.removeEventListener("message", listener);

                if (ev.data.error) {
                    reject(ev.data.error);
                    return;
                }
                resolve(ev.data.result);
            }
            worker.addEventListener("message", listener);
            worker.postMessage({ type, uuid, input })
        })
    }

    async function convertToArrayBuffer(blob: Blob) {
        return await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(blob);
        });
    }

    export function observeDOM() {
        throw new Error("not implemented yet")
    }
}