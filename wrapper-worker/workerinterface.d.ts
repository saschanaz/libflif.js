interface libflifDecoderOptions {
    crcCheck?: boolean;
    quality?: number;
    scale?: number;
    resize?: [number, number];
    fit?: [number, number];
    
    // libflif.js specific
    progressiveStep?: number;
}

interface libflifDecoderInput {
    data: ArrayBuffer;

    options?: libflifDecoderOptions;
}

interface libflifFrame {
    data: ArrayBuffer;
    width: number;
    height: number;
    depth?: number;
    frameDelay?: number;
}

interface libflifEncoderOptions {
    interlaced?: boolean;
    learnRepeat?: number;
    autoColorBuckets?: boolean;
    paletteSize?: number;
    lookback?: number;
    divisor?: number;
    minSize?: number;
    splitThreshold?: number;
    alphaZeroLossless?: boolean;
    chanceCutoff?: number;
    chanceAlpha?: number;
    crcCheck?: number;
    yCoCg?: boolean;
    frameShape?: boolean;
}

interface libflifEncoderInput {
    frames: libflifFrame[];
    loop?: number;

    options?: libflifEncoderOptions;
}

type libflifWorkerInputMessageData = libflifWorkerDecoderInputMessageData | libflifWorkerEncoderInputMessageData;

interface libflifWorkerDecoderInputMessageData {
    type: "decode";
    uuid: string;
    input: libflifDecoderInput;
}

interface libflifWorkerEncoderInputMessageData {
    type: "encode";
    uuid: string;
    input: libflifEncoderInput;
}

interface libflifWorkerOutputMessageData {
    uuid: string;
    error: string;
    result: ArrayBuffer;
    debug: string;
    progress: libflifProgressiveDecodingResult;
}

interface libflifProgressiveDecodingResult {
    quality: number;
    bytesRead: number;
    frames: libflifFrame[]; // actually SharedArrayBuffer
    loop: number;
}