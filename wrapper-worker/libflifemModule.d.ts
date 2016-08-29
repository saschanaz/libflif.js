interface libflifemModule {
    FLIFImage: FLIFImageConstructor;
    FLIFDecoder: FLIFDecoderConstructor;
    FLIFEncoder: FLIFEncoderConstructor;
}

declare interface FLIFImage extends EmscriptenClass {
    width: number;
    height: number;
    nbChannels: number;
    depth: number;
    frameDelay: number;

    writeRowRGBA8(row: number, bufferPointer: number, bufferByteLength: number): void;
    readRowRGBA8(row: number): Uint8Array;
    writeRowRGBA16(row: number, bufferPointer: number, bufferByteLength: number): void;
    readRowRGBA16(row: number): void;
}

declare interface FLIFImageConstructor {
    prototype: FLIFImage;

    create(width: number, height: number): FLIFImage;
    createHDR(width: number, height: number): FLIFImage;
}

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

declare interface FLIFEncoder extends EmscriptenClass {
    addImage(image: FLIFImage): void;
    encodeToFile(filename: string): void;
    encodeToMemory(): Uint8Array;

    setInterlaced(interlaced: boolean): void;
    setLearnRepeat(learnRepeats: number): void;
    setAutoColorBuckets(acb: boolean): void;
    setPaletteSize(paletteSize: number): void;
    setLookback(lookback: number): void;
    setDivisor(divisor: number): void;
    setMinSize(minSize: number): void;
    setThreshold(threshold: number): void;
    setAlphaZeroLossless(): void;
    setChanceCutoff(cutoff: number): void;
    setChanceAlpha(alpha: number): void;
    setCRCCheck(crcCheck: boolean): void;
    setChannelCompact(plc: boolean): void;
    setYCoCg(ycocg: boolean): void;
    setFrameShape(frs: boolean): void;
}

declare interface FLIFEncoderConstructor {
    new (): FLIFEncoder;
    prototype: FLIFEncoder;
}

declare function _libflifem(options: any): EmscriptenModule & libflifemModule;