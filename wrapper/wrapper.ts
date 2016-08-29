declare namespace libflif {
    var libDir: string;
    var debug: boolean;
}

namespace libflif {
    interface libflifWorkerMessageData {
        uuid: string;
        error: string;
        result: ArrayBuffer;
        debug: string;
        progress: libflifProgressiveDecodingResult;
    }
    export interface libflifProgressiveDecodingResult {
        quality: number;
        bytesRead: number;
        width: number;
        height: number;
        buffer: ArrayBuffer; // actually SharedArrayBuffer
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

    export function startWorker() {
        if (worker) {
            return;
        }
        worker = new Worker(`${libDir ? libDir + '/' : ""}worker.js`);
        worker.addEventListener("message", (ev: libflifWorkerMessageEvent) => {
            if (ev.data.error) {
                console.error(`worker: ${ev.data.error}`);
            }
            if (ev.data.debug) {
                debugLog(`worker: ${ev.data.debug}`);
            }
        })
    }

    export async function decode(input: ArrayBuffer | Blob, callback: (result: libflifProgressiveDecodingResult) => any) {
        await sendMessage("decode", input, { callback });
    }

    export function encode(input: ArrayBuffer | Blob, width: number, height: number) {
        return sendMessage("encode", input, { imageInfo: { width, height } });
    }

    interface SendMessageBag {
        callback?: (result: libflifProgressiveDecodingResult) => any;
        imageInfo?: any;
    }
    async function sendMessage(type: "decode" | "encode", input: ArrayBuffer | Blob, bag: SendMessageBag) {
        startWorker();

        const arrayBuffer = input instanceof Blob ? await convertToArrayBuffer(input) : input;

        return new Promise<ArrayBuffer>((resolve, reject) => {
            const uuid = UUID.generate();
            const listener = (ev: libflifWorkerMessageEvent) => {
                if (ev.data.uuid !== uuid) {
                    return;
                }

                if (ev.data.error) {
                    reject(ev.data.error);
                    return;
                }
                debugLog(`received ${type} result from worker.`);
                if (!ev.data.progress) {
                    worker.removeEventListener("message", listener);
                    resolve(ev.data.result);
                }
                else {
                    bag.callback(ev.data.progress);
                    if (ev.data.progress.quality === 1) {
                        worker.removeEventListener("message", listener);
                        resolve();
                    }
                }
            }
            worker.addEventListener("message", listener);

            debugLog(`sending data for ${type} to worker.`);
            if (bag.imageInfo) {
                worker.postMessage({ type, uuid, input: arrayBuffer, imageInfo: bag.imageInfo })
            } 
            else {
                worker.postMessage({ type, uuid, input: arrayBuffer })
            }
        })
    }

    async function convertToArrayBuffer(blob: Blob) {
        return await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(blob);
        });
    }

    function debugLog(text: string) {
        if (debug) {
            console.log(`libflif: ${text} ${new Date()}`)
        }
    }

    export function observeDOM() {
        throw new Error("not implemented yet")
    }
}