// This should later be a Web Worker, currently this is just a normal script

importScripts("flif.js");

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
            const result = decode(ev.data.input);
            (self as any as Worker).postMessage({
                debug: `decode complete, sending data to wrapper.`
            });
            (self as any as Worker).postMessage({
                uuid: ev.data.uuid,
                result
            });
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
    catch (error) {
        (self as any as Worker).postMessage({ error });
    }
})

interface libflifem {

}

declare function _libflifem(options: any): EmscriptenModule & libflifem;

function decode(input: ArrayBuffer) {
    // TODO: module instance should be kept after making it a library
    const libflifem = _libflifem({ memoryInitializerPrefixURL: "built/" });
    libflifem.FS.writeFile("input.flif", new Uint8Array(input), { encoding: "binary" });
    libflifem.callMain(["-d", "input.flif", "output.png"]);
    return libflifem.FS.readFile("output.png").buffer;
}

function encode(input: ArrayBuffer) {
    // TODO: module instance should be kept after making it a library
    const libflifem = _libflifem({ memoryInitializerPrefixURL: "built/" });
    libflifem.FS.writeFile("input.png", new Uint8Array(input), { encoding: "binary" });
    libflifem.callMain(["input.png", "output.flif"]);
    return libflifem.FS.readFile("output.flif").buffer;
}

namespace EmscriptenUtility {
    export interface AllocatedArray {
        content: any[];
        pointer: number;
    }

    function allocateString(em: EmscriptenModule, input: string) {
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