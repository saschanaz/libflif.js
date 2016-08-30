declare namespace libflif {
    var libDir: string;
    var debug: boolean;
}

namespace libflif {
    interface libflifWorkerOutputMessageEvent extends MessageEvent {
        data: libflifWorkerOutputMessageData;
    }

    namespace UUID {
        function uuid16() {
            return (Math.random() * 0xFFFF | 0).toString(16)
        }

        export function generate() {
            return `${uuid16()}${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}${uuid16()}${uuid16()}`;
        }
    }
    let worker: Worker;

    export function startWorker() {
        if (worker) {
            return;
        }
        worker = new Worker(`${libDir ? libDir + '/' : ""}worker.js`);
        worker.addEventListener("message", (ev: libflifWorkerOutputMessageEvent) => {
            if (ev.data.error) {
                console.error(`worker: ${ev.data.error}`);
            }
            if (ev.data.debug) {
                debugLog(`worker: ${ev.data.debug}`);
            }
        })
    }

    export async function decode(input: ArrayBuffer | Blob, callback: (result: libflifProgressiveDecodingResult) => any) {
        const arrayBuffer = input instanceof Blob ? await convertToArrayBuffer(input) : input;

        await sendMessage("decode", arrayBuffer, { callback });
    }

    export function encode(input: libflifEncoderInput) {
        return sendMessage("encode", input);
    }

    interface SendMessageBag {
        callback?: (result: libflifProgressiveDecodingResult) => any;
    }
    async function sendMessage(type: "decode" | "encode", input: ArrayBuffer | libflifEncoderInput, bag?: SendMessageBag) {
        startWorker();

        return new Promise<ArrayBuffer>((resolve, reject) => {
            const uuid = UUID.generate();
            const listener = (ev: libflifWorkerOutputMessageEvent) => {
                if (ev.data.uuid !== uuid) {
                    return;
                }

                if (ev.data.error) {
                    reject(ev.data.error);
                    return;
                }
                debugLog(`received ${type} result from worker.`);
                if (!ev.data.progress) {
                    worker.removeEventListener("message", listener);
                    resolve(ev.data.result);
                }
                else {
                    bag.callback(ev.data.progress);
                    if (ev.data.progress.quality === 1) {
                        worker.removeEventListener("message", listener);
                        resolve();
                    }
                }
            }
            worker.addEventListener("message", listener);

            debugLog(`sending data for ${type} to worker.`);
            worker.postMessage({ type, uuid, input });
        })
    }

    async function convertToArrayBuffer(blob: Blob) {
        return await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(blob);
        });
    }

    function debugLog(text: string) {
        if (debug) {
            console.log(`libflif: ${text} ${new Date()}`)
        }
    }

    export function observeDOM() {
        throw new Error("not implemented yet")
    }
}


interface AnimatedFrame {
    data: Blob
    width: number;
    height: number;
    frameDelay: number;
}
interface Animation {
    frames: AnimatedFrame[];
    loop: number;
}
// TODO: fork this to a separate repo
class AnimationDirector {
    private _animationFrames: AnimatedFrame[];
    private _animationLoop: number;
    private _currentLoop: number;
    private _nextFrameTime = 0;
    private _currentFrameIndex = -1;
    private _working = false;

    get frames() {
        return this._animationFrames.slice();
    }

    get currentFrameIndex() {
        return this._currentFrameIndex;
    }

    get working() {
        return this._working;
    }

    get duration() {
        let duration = 0;
        for (let frame of this._animationFrames) {
            duration += frame.frameDelay;
        }
        return duration;
    }

    constructor(animation: Animation) {
        if (!Array.isArray(this._animationFrames)) {
            throw new Error("Invalid non-array frame array.")
        }
        this._animationFrames = this._cloneSanitizedFrames(animation.frames);
        this._animationLoop = (animation.loop | 0) || 0;

        if (this._animationFrames.length <= 1) {
            throw new Error(`Expected multiple frames but got ${this._animationFrames.length} frame.`);
        }
        if (isNaN(this._animationLoop) || this._animationLoop <= 0) {
            throw new Error(`Invalid non-positive loop value.`)
        }
    }

    async start(animate: (frame: AnimatedFrame) => any) {
        if (this._working) {
            return;
        }
        this._working = true;

        let time = performance.now();
        while (this._working) {
            if (this._nextFrameTime <= time) {
                this._currentFrameIndex++;
                if (this._currentFrameIndex >= this._animationFrames.length) {
                    this._currentFrameIndex = 0;
                    this._currentLoop++;

                    if (this._animationLoop !== 0 && /* allow infinite loop when loop value is zero */
                        this._currentLoop >= this._animationLoop) {

                        this._working = false;
                        break;
                    }
                }
                const currentFrame = this._animationFrames[this._currentFrameIndex];
                this._nextFrameTime += currentFrame.frameDelay;
                try {
                    animate(currentFrame);
                }
                catch (err) {
                    console.error(err);
                }
            }

            time = await new Promise<number>(resolve => requestAnimationFrame(time => resolve(time)));
        }
    }

    stop() {
        if (!this._working) {
            return;
        }
        this._working = false;
    }

    private _cloneSanitizedFrames(animatedFrames: AnimatedFrame[]) {
        const result: AnimatedFrame[] = [];

        for (let frame of animatedFrames) { // cannot use const because of Firefox
            const sanitized = Object.freeze(Object.assign({}, frame));
            sanitized.frameDelay = sanitized.frameDelay || 100;
            sanitized.width = sanitized.width | 0;
            sanitized.height = sanitized.height | 0;
            if (!(sanitized instanceof Blob) || sanitized.data.size === 0) {
                throw new Error("Frame does not contain non-zero-sized blob data.");
            }
            if (sanitized.frameDelay <= 0) {
                throw new Error("Frame delay must be positive value.");
            }
            if (sanitized.width <= 0) {
                throw new Error("Frame width must be positive value.");
            }
            if (sanitized.height <= 0) {
                throw new Error("Frame height must be positive value.");
            }
        }

        return result;
    }
}