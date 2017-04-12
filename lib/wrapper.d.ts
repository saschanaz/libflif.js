declare namespace libflif {
    var libDir: string;
    var debug: boolean;
}
declare namespace libflif {
    /** Call this first to remove worker loading delay before any decoding call. */
    function startWorker(): void;
    function decode(input: ArrayBuffer | Blob, callback: (result: libflifProgressiveDecodingResult) => any, options?: libflifDecoderOptions): Promise<void>;
    function encode(input: libflifEncoderInput): Promise<ArrayBuffer>;
    function observeDOM(): void;
}
interface AnimatedFrame {
    data: Blob;
    width: number;
    height: number;
    frameDelay: number;
}
interface Animation {
    frames: AnimatedFrame[];
    loop: number;
}
declare class AnimationDirector {
    private _animationFrames;
    private _animationLoop;
    private _currentLoop;
    private _currentFrameIndex;
    private _working;
    readonly frames: AnimatedFrame[];
    readonly currentFrameIndex: number;
    readonly working: boolean;
    readonly duration: number;
    constructor(animation: Animation);
    alterFrames(frames: AnimatedFrame[]): void;
    start(animate: (frame: AnimatedFrame) => any): Promise<void>;
    private _safeAnimate(frame, animate);
    stop(): void;
    private _cloneSanitizedFrames(animatedFrames);
}
