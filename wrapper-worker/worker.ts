// This should later be a Web Worker, currently this is just a normal script

importScripts("libflif.js");

declare class SharedArrayBuffer extends ArrayBuffer {

}

interface libflifWrapperMessageData {
    type: "encode" | "decode";
    uuid: string;
    input: ArrayBuffer;
    imageInfo: ImageInfo;
}
interface ImageInfo {
    width: number;
    height: number;
}
interface libflifWrapperMessageEvent extends MessageEvent {
    data: libflifWrapperMessageData;
}

self.addEventListener("message", (ev: libflifWrapperMessageEvent) => {
    (self as any as Worker).postMessage({
        debug: `received data for ${ev.data.type}, size=${ev.data.input.byteLength}`
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
            const result = encode(ev.data.input, ev.data.imageInfo.width, ev.data.imageInfo.height);
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
        (self as any as Worker).postMessage({ error: err.stack || err.message || "Unspecified error occurred" });
    }
})

const libflifem = _libflifem({ memoryInitializerPrefixURL: "built/" });

function decode(uuid: string, input: ArrayBuffer) {
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
                error: err.message
            });
        }
        return quality + 1000;
    });
    decoder.setCallback(callback);

    const allocated = libflifem._malloc(input.byteLength);
    libflifem.HEAP8.set(new Uint8Array(input), allocated);
    try {
        decoder.decodeMemory(allocated, input.byteLength);
    }
    finally {
        libflifem._free(allocated);
        decoder.delete();
        libflifem.Runtime.removeFunction(callback);
    }
    //return libflifem.FS.readFile("output.png").buffer;
}

function encode(input: ArrayBuffer, width: number, height: number) {
    const encoder = new libflifem.FLIFEncoder();
    const image = libflifem.FLIFImage.create(width, height);
    const bufferView = new Uint8Array(input);
    for (let i = 0; i < height; i++) {
        const size = width * 4;
        const offset = size * i;
        const allocated = libflifem._malloc(size);
        libflifem.HEAP8.set(bufferView.slice(offset, offset + size), allocated);
        image.writeRowRGBA8(i, allocated, size);
        libflifem._free(allocated);
    }
    encoder.addImage(image);

    let result: ArrayBuffer;
    try {
        const encodeView = encoder.encodeToMemory();
        result = encodeView.buffer.slice(encodeView.byteOffset, encodeView.byteOffset + encodeView.byteLength);
    }
    finally {
        image.delete();
        encoder.delete();
    }
    return result;
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