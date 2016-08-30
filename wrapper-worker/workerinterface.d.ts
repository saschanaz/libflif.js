interface libflifEncoderInputFrame {
    data: ArrayBuffer;
    width: number;
    height: number;
    frameDelay?: number;
}

interface libflifEncoderInput {
    frames: libflifEncoderInputFrame[];
    loop?: number;

    // TODO: encoder options
}

type libflifWorkerInputMessageData = libflifWorkerDecoderInputMessageData | libflifWorkerEncoderInputMessageData;

interface libflifWorkerDecoderInputMessageData {
    type: "encode" | "decode";
    uuid: string;
    input: ArrayBuffer;
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
    width: number;
    height: number;
    buffer: ArrayBuffer; // actually SharedArrayBuffer
}