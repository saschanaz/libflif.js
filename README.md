# libflif.js
Another trial to get FLIF to the web platform. Sample page [here](//saschanaz.github.io/libflif.js/).

# Use

1. Get lib/wrapper.js, lib/worker.js, lib/libflif.js, lib/libflif.js.mem in the same directory
2. (Optionally) define `libflifjs` global variable of which the format is:
    ```json
    {
        "libDir": "String. the directory of worker.js and libflif.js. Insert this if the HTML file and libflifjs files are in different directories.",
        "debug": "Boolean. If this is true then worker will emit debug console message."
    }
    ```
3. Insert lib/wrapper.js script tag on your HTML file

# API

```ts
declare namespace libflif {
    // call this to prepare worker before any decoding/encoding calls
    function startWorker(): void;

    function decode(input: ArrayBuffer | Blob, callback: (result: libflifProgressiveDecodingResult) => any, options?: libflifDecoderOptions): Promise<void>;
    function encode(input: libflifEncoderInput): Promise<ArrayBuffer>;
}

interface libflifDecoderInput {
    data: ArrayBuffer;

    options?: libflifDecoderOptions;
}

interface libflifDecoderOptions {
    crcCheck?: boolean;
    quality?: number;
    scale?: number;
    resize?: [number, number];
    fit?: [number, number];
    
    // progressive callback
    progressiveInitialLimit?: number;
    progressiveStep?: number;
}

interface libflifProgressiveDecodingResult {
    quality: number;
    bytesRead: number;
    frames: libflifFrame[];
    loop: number;
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
    crcCheck?: boolean;
    yCoCg?: boolean;
    frameShape?: boolean;
}

interface libflifEncoderInput {
    frames: libflifFrame[];
    loop?: number;

    options?: libflifEncoderOptions;
}
```
