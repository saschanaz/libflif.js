var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var libflif;
(function (libflif) {
    var UUID;
    (function (UUID) {
        function uuid16() {
            return (Math.random() * 0xFFFF | 0).toString(16);
        }
        function generate() {
            return `${uuid16()}${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}-${uuid16()}${uuid16()}${uuid16()}`;
        }
        UUID.generate = generate;
    })(UUID || (UUID = {}));
    let worker;
    function startWorker() {
        if (worker) {
            return;
        }
        worker = new Worker(`${libflif.libDir ? libflif.libDir + '/' : ""}worker.js`);
        worker.addEventListener("message", (ev) => {
            if (ev.data.error) {
                console.error(`worker: ${ev.data.error}`);
            }
            if (ev.data.debug) {
                debugLog(`worker: ${ev.data.debug}`);
            }
        });
    }
    libflif.startWorker = startWorker;
    function decode(input, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const arrayBuffer = input instanceof Blob ? yield convertToArrayBuffer(input) : input;
            yield sendMessage("decode", arrayBuffer, { callback });
        });
    }
    libflif.decode = decode;
    function encode(input) {
        return sendMessage("encode", input);
    }
    libflif.encode = encode;
    function sendMessage(type, input, bag) {
        return __awaiter(this, void 0, void 0, function* () {
            startWorker();
            return new Promise((resolve, reject) => {
                const uuid = UUID.generate();
                const listener = (ev) => {
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
                        if (ev.data.progress.quality === 10000) {
                            worker.removeEventListener("message", listener);
                            resolve();
                        }
                    }
                };
                worker.addEventListener("message", listener);
                debugLog(`sending data for ${type} to worker.`);
                worker.postMessage({ type, uuid, input });
            });
        });
    }
    function convertToArrayBuffer(blob) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsArrayBuffer(blob);
            });
        });
    }
    function debugLog(text) {
        if (libflif.debug) {
            console.log(`libflif: ${text} ${new Date()}`);
        }
    }
    function observeDOM() {
        throw new Error("not implemented yet");
    }
    libflif.observeDOM = observeDOM;
})(libflif || (libflif = {}));
// TODO: fork this to a separate repo
class AnimationDirector {
    constructor(animation) {
        this._currentFrameIndex = -1;
        this._working = false;
        if (!Array.isArray(animation.frames)) {
            throw new Error("Invalid non-array frame array.");
        }
        this._animationFrames = this._cloneSanitizedFrames(animation.frames);
        this._animationLoop = (animation.loop | 0) || 0;
        if (this._animationFrames.length <= 1) {
            throw new Error(`Expected multiple frames but got ${this._animationFrames.length} frame.`);
        }
        if (this.duration === 0) {
            throw new Error("Invalid zero-duration animation file.");
        }
        if (isNaN(this._animationLoop) || this._animationLoop < 0) {
            throw new Error(`Invalid non-numeric or negative loop value.`);
        }
    }
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
    alterFrames(frames) {
        this._animationFrames = this._cloneSanitizedFrames(frames);
    }
    start(animate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._working) {
                return;
            }
            if (!(animate instanceof Function)) {
                throw new Error("Invalid non-function callback");
            }
            this._working = true;
            let now = performance.now();
            let lastFramePlannedRenderTime = now;
            let lastFrameDelay = 0;
            while (this._working) {
                /*
                TODO: play a frame
                on next requestanimationframe, check current frame delay has finished
                if finished, shifttime get next frame and check frame delay has finished
                if finished, ...
                if not, play that frame
    
                while-loop should play a frame before any looping
                */
                if (now < lastFramePlannedRenderTime + lastFrameDelay) {
                    now = yield new Promise(resolve => requestAnimationFrame(time => resolve(time)));
                    continue; // should be kept more
                }
                this._currentFrameIndex++;
                // loop check
                if (this._currentFrameIndex >= this._animationFrames.length) {
                    this._currentFrameIndex = 0;
                    if (this._animationLoop !== 0) {
                        this._currentLoop++;
                        if (this._currentLoop >= this._animationLoop) {
                            // render last frame and terminate
                            this._currentFrameIndex = this._animationFrames.length - 1;
                            this._safeAnimate(this._animationFrames[this._currentFrameIndex], animate);
                            this._working = false;
                            break;
                        }
                    }
                }
                const currentFrame = this._animationFrames[this._currentFrameIndex];
                lastFramePlannedRenderTime += lastFrameDelay;
                lastFrameDelay = currentFrame.frameDelay;
                if (now < lastFramePlannedRenderTime + lastFrameDelay) {
                    this._safeAnimate(currentFrame, animate);
                    now = yield new Promise(resolve => requestAnimationFrame(time => resolve(time)));
                }
            }
        });
    }
    _safeAnimate(frame, animate) {
        try {
            animate(frame);
        }
        catch (err) {
            console.error(err);
        }
    }
    stop() {
        if (!this._working) {
            return;
        }
        this._working = false;
    }
    _cloneSanitizedFrames(animatedFrames) {
        const result = [];
        for (let frame of animatedFrames) {
            const sanitized = Object.assign({}, frame);
            sanitized.frameDelay = sanitized.frameDelay || 100;
            sanitized.width = sanitized.width | 0;
            sanitized.height = sanitized.height | 0;
            Object.freeze(sanitized);
            if (!(sanitized.data instanceof Blob) || sanitized.data.size === 0) {
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
            result.push(sanitized);
        }
        return result;
    }
}
//# sourceMappingURL=wrapper.js.map