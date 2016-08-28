// This should later be a Web Worker, currently this is just a normal script

importScripts("libflif.js");

declare class SharedArrayBuffer extends ArrayBuffer {

}

interface libflifWrapperMessageData {
    type: "encode" | "decode";
    uuid: string;
    input: ArrayBuffer;
}
interface libflifWrapperMessageEvent extends MessageEvent {
    data: libflifWrapperMessageData;
}

self.addEventListener("message", (ev: libflifWrapperMessageEvent) => {
    (self as any as Worker).postMessage({
        debug: `received data for ${ev.data.type}.`
    });
    try {
        if (ev.data.type === "decode") {
            decode(ev.data.uuid, ev.data.input);

            // (self as any as Worker).postMessage({
            //     debug: `decode complete, sending data to wrapper.`
            // });
            // (self as any as Worker).postMessage({
            //     uuid: ev.data.uuid,
            //     result
            // });
        }
        else {
            const result = encode(ev.data.input);
            (self as any as Worker).postMessage({
                debug: `encode complete, sending data to wrapper.`
            });
            (self as any as Worker).postMessage({
                uuid: ev.data.uuid,
                result
            });
        }
    }
    catch (err) {
        (self as any as Worker).postMessage({ error: err.stack || err.message || "Unknown error occurred" });
    }
})

const libflifem = _libflifem({ memoryInitializerPrefixURL: "built/" });

function decode(uuid: string, input: ArrayBuffer) {
    libflifem.FS.writeFile("input.flif", new Uint8Array(input), { encoding: "binary" });
    const decoder = new libflifem.FLIFDecoder();
    let bufferView: Uint8Array;
    const callback = libflifem.Runtime.addFunction((quality: number, bytesRead: number) => {
        const firstFrame = decoder.getImage(0);
        if (typeof SharedArrayBuffer === "undefined") {
            // no SharedArrayBuffer, create new ArrayBuffer every time 
            bufferView = new Uint8Array(new ArrayBuffer(firstFrame.width * firstFrame.height * 4));
        }
        else if (!bufferView) {
            // supports SharedArrayBuffer
            bufferView = new Uint8Array(new SharedArrayBuffer(firstFrame.width * firstFrame.height * 4));
        }
        for (let i = 0; i < firstFrame.height; i++) {
            const row = firstFrame.readRowRGBA8(i);
            const offset = firstFrame.width * 4 * i;
            bufferView.set(row, offset);
        }

        try {
            (self as any as Worker).postMessage({
                uuid,
                progress: {
                    width: firstFrame.width,
                    height: firstFrame.height,
                    quality: quality / 10000,
                    bytesRead,
                    buffer: bufferView.buffer
                },
                debug: `progressive decoding: width=${firstFrame.width} height=${firstFrame.height} quality=${quality}, bytesRead=${bytesRead}`
            });
        }
        catch (err) {
            (self as any as Worker).postMessage({
                debug: err.message
            });
        }
        return quality + 1000;
    });
    decoder.setCallback(callback);
    try {
        decoder.decodeFile("input.flif");
    }
    finally {
        decoder.delete();
        libflifem.Runtime.removeFunction(callback);
    }
    //return libflifem.FS.readFile("output.png").buffer;
}

function encode(input: ArrayBuffer) {
    libflifem.FS.writeFile("input.png", new Uint8Array(input), { encoding: "binary" });
    libflifem.callMain(["input.png", "output.flif"]);
    return libflifem.FS.readFile("output.flif").buffer;
}

namespace EmscriptenUtility {
    export interface AllocatedArray {
        content: any[];
        pointer: number;
    }

    export function allocateString(em: EmscriptenModule, input: string) {
        var array = em.intArrayFromString(input, false);
        var pointer = em._malloc(array.length);
        em.HEAP8.set(new Int8Array(array), pointer);
        return pointer;
    }

    export function allocateStringArray(em: EmscriptenModule, input: string[]) {
        var array: number[] = [];
        input.forEach(item => array.push(allocateString(em, item)));
        var pointer = em._malloc(array.length * 4);
        em.HEAP32.set(new Int32Array(array), pointer / 4);
        return <AllocatedArray>{
            content: array,
            pointer: pointer
        };
    }

    export function deleteStringArray(em: EmscriptenModule, input: AllocatedArray) {
        input.content.forEach((item) => em._free(item));
        em._free(input.pointer);
    }
}

module EmscriptenUtility.FileSystem {
    export async function writeBlob(em: EmscriptenModule, path: string, blob: Blob) {
        const result = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(blob);
        });
        em.FS.writeFile(path, new Uint8Array(result), { encoding: "binary" });
    }
}