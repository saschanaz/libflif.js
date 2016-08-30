interface EncoderInputFrame {
    data: ArrayBuffer;
    width: number;
    height: number;
    frameDelay: number;
}

interface EncoderInput {
    frames: EncoderInputFrame[];
    loop: number;

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
    input: EncoderInput;
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