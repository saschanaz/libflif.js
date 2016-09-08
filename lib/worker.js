// This should later be a Web Worker, currently this is just a normal script
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
importScripts("libflif.js");
let notifyReady;
const whenReady = new Promise(resolve => notifyReady = resolve);
const libflifem = _libflifem({
    onRuntimeInitialized: () => notifyReady()
});
self.addEventListener("message", (ev) => __awaiter(this, void 0, void 0, function* () {
    yield whenReady;
    self.postMessage({
        debug: `received data for ${ev.data.type}. Current memory size: ${libflifem.buffer.byteLength}`
    });
    try {
        if (ev.data.type === "decode") {
            decode(ev.data.uuid, ev.data.input);
        }
        else {
            const result = encode(ev.data.input);
            self.postMessage({
                debug: `encode complete, sending data to wrapper. Current memory size: ${libflifem.buffer.byteLength}`
            });
            self.postMessage({
                uuid: ev.data.uuid,
                result
            });
        }
    }
    catch (err) {
        self.postMessage({ uuid: ev.data.uuid, error: err.stack || err.message || "Unspecified error occurred" });
    }
}));
function decode(uuid, input) {
    const decoder = new libflifem.FLIFDecoder();
    const callback = libflifem.Runtime.addFunction((quality, bytesRead) => {
        const frames = [];
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
        const progress = {
            quality,
            bytesRead,
            frames,
            loop: decoder.numLoops
        };
        self.postMessage({
            uuid,
            progress,
            debug: `progressive decoding: width=${frames[0].width} height=${frames[0].height} quality=${quality}, bytesRead=${bytesRead}. Current memory size: ${libflifem.buffer.byteLength}`
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
function encode(input) {
    const encoder = new libflifem.FLIFEncoder();
    const images = [];
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
    let result;
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
var EmscriptenUtility;
(function (EmscriptenUtility) {
    function allocateString(em, input) {
        var array = em.intArrayFromString(input, false);
        var pointer = em._malloc(array.length);
        em.HEAP8.set(new Int8Array(array), pointer);
        return pointer;
    }
    EmscriptenUtility.allocateString = allocateString;
    function allocateStringArray(em, input) {
        var array = [];
        input.forEach(item => array.push(allocateString(em, item)));
        var pointer = em._malloc(array.length * 4);
        em.HEAP32.set(new Int32Array(array), pointer / 4);
        return {
            content: array,
            pointer: pointer
        };
    }
    EmscriptenUtility.allocateStringArray = allocateStringArray;
    function deleteStringArray(em, input) {
        input.content.forEach((item) => em._free(item));
        em._free(input.pointer);
    }
    EmscriptenUtility.deleteStringArray = deleteStringArray;
})(EmscriptenUtility || (EmscriptenUtility = {}));
//# sourceMappingURL=worker.js.map