interface libflifFrame {
    data: ArrayBuffer;
    width: number;
    height: number;
    frameDelay?: number;
}

interface libflifEncoderInput {
    frames: libflifFrame[];
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
    frames: libflifFrame[]; // actually SharedArrayBuffer
    loop: number;
}