interface libflifemModule {
    FLIFImage: typeof FLIFImage;
    FLIFDecoder: typeof FLIFDecoder;
}

declare interface FLIFImage extends EmscriptenClass {
    width: number;
    height: number;
    nbChannels: number;
    depth: number;
    frameDelay: number;

    writeRowRGBA8(row: number): void;
    readRowRGBA8(row: number): Uint8Array;
    writeRowRGBA16(row: number): void;
    readRowRGBA16(row: number): void;
}

declare interface FLIFImageConstructor {
    new (): FLIFImage;
    prototype: FLIFImage;

    create(width: number, height: number): FLIFImage;
    createHDR(width: number, height: number): FLIFImage;
}
declare var FLIFImage: FLIFImageConstructor;

declare interface FLIFDecoder extends EmscriptenClass {
    decodeFile(filename: string): void;
    decodeMemory(bufferPointer: number, bufferByteLength: number): void;

    numImages: number;
    numLoops: number;

    getImage(index: number): FLIFImage;
    abort(): number;
    setQuality(quality: number): void;
    setScale(scale: number): void;
    setResize(width: number, height: number): void;
    setFit(width: number, height: number): void;
    setCallback(callbackPointer: number): void;
    setFirstCallbackQuality(quality: number): void;
}

declare interface FLIFDecoderConstructor {
    new (): FLIFDecoder;
    prototype: FLIFDecoder;
}
declare var FLIFDecoder: FLIFDecoderConstructor;

declare function _libflifem(options: any): EmscriptenModule & libflifemModule;