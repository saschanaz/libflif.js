interface libflifem {
}
declare function _libflifem(): EmscriptenModule & libflifem;
declare const libflifem: EmscriptenModule & libflifem;
declare function convert(input: ArrayBuffer): Uint8Array;
declare module EmscriptenUtility {
    interface AllocatedArray {
        content: any[];
        pointer: number;
    }
    function allocateStringArray(em: EmscriptenModule, input: string[]): AllocatedArray;
    function deleteStringArray(em: EmscriptenModule, input: AllocatedArray): void;
}
declare module EmscriptenUtility.FileSystem {
    function writeBlob(em: EmscriptenModule, path: string, blob: Blob): Promise<void>;
}
