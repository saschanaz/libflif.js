// This should later be a Web Worker, currently this is just a normal script

importScripts("libflif.js");

declare class SharedArrayBuffer extends ArrayBuffer {

}

interface libflifWorkerInputMessageEvent extends MessageEvent {
    data: libflifWorkerInputMessageData;
}

self.addEventListener("message", (ev: libflifWorkerInputMessageEvent) => {
    (self as any as Worker).postMessage({
        debug: `received data for ${ev.data.type}`
    });
    try {
        if (ev.data.type === "decode") {
            decode(ev.data.uuid, ev.data.input as ArrayBuffer);

            // (self as any as Worker).postMessage({
            //     debug: `decode complete, sending data to wrapper.`
            // });
            // (self as any as Worker).postMessage({
            //     uuid: ev.data.uuid,
            //     result
            // });
        }
        else {
            const result = encode(ev.data.input as libflifEncoderInput);
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
        (self as any as Worker).postMessage({ uuid: ev.data.uuid, error: err.stack || err.message || "Unspecified error occurred" });
    }
})

const libflifem = _libflifem();

function decode(uuid: string, input: ArrayBuffer) {
    const decoder = new libflifem.FLIFDecoder();
    const callback = libflifem.Runtime.addFunction((quality: number, bytesRead: number) => {
        const frames: libflifFrame[] = [];
        for (let i = 0; i < decoder.numImages; i++) {
            const frame = decoder.getImage(i); 
            // TODO: replace ArrayBuffer to SharedArrayBuffer
            // (currently impossible on Nightly because of structured clone error
            const bufferView = new Uint8Array(new ArrayBuffer(frame.width * frame.height * 4));
            for (let i = 0; i < frame.height; i++) {
                const row = frame.readRowRGBA8(i);
                const offset = frame.width * 4 * i;
                bufferView.set(row, offset);
                frame.clearBuffer(); // remove C++ internal buffer created by readRow
            }
            frames.push({
                data: bufferView.buffer,
                width: frame.width,
                height: frame.height,
                frameDelay: frame.frameDelay,
            });
            frame.delete(); // will not affect decoder internal image instance 
        }

        const progress: libflifProgressiveDecodingResult = {
            quality,
            bytesRead,
            frames,
            loop: decoder.numLoops
        };

        (self as any as Worker).postMessage({
            uuid,
            progress,
            debug: `progressive decoding: width=${frames[0].width} height=${frames[0].height} quality=${quality}, bytesRead=${bytesRead}`
        });
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
}

function encode(input: libflifEncoderInput) {
    const encoder = new libflifem.FLIFEncoder();
    const images: FLIFImage[] = [];
    for (let frame of input.frames) {
        const image = libflifem.FLIFImage.create(frame.width, frame.height);
        const bufferView = new Uint8Array(frame.data);
        for (let i = 0; i < frame.height; i++) {
            const size = frame.width * 4;
            const offset = size * i;
            const allocated = libflifem._malloc(size);
            libflifem.HEAP8.set(bufferView.slice(offset, offset + size), allocated);
            image.writeRowRGBA8(i, allocated, size);
            libflifem._free(allocated);
        }
        if ("frameDelay" in frame) {
            image.frameDelay = frame.frameDelay;
        }

        encoder.addImage(image);
        images.push(image);
    }

    let result: ArrayBuffer;
    try {
        const encodeView = encoder.encodeToMemory();
        result = encodeView.buffer.slice(encodeView.byteOffset, encodeView.byteOffset + encodeView.byteLength);
    }
    finally {
        for (let image of images) {
            image.delete();
        }
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