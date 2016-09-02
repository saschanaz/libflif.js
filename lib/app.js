var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const decoderCanvas = document.createElement("canvas");
const decoderContext = decoderCanvas.getContext("2d");
const encoderCanvas = document.createElement("canvas");
const encoderContext = encoderCanvas.getContext("2d");
let director;
libflif.startWorker();
document.addEventListener("DOMContentLoaded", () => {
    decodeButton.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
        if (decodeButton.files.length === 0) {
            return;
        }
        clearMessage();
        lockButtons();
        try {
            yield decodeSelectedFile(decodeButton.files[0]);
        }
        finally {
            unlockButtons();
        }
    }));
    encodeButton.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
        if (encodeButton.files.length === 0) {
            return;
        }
        clearMessage();
        lockButtons();
        try {
            yield encodeSelectedFile(encodeButton.files);
        }
        finally {
            unlockButtons();
        }
    }));
    encodeAPNGButton.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
        if (encodeAPNGButton.files.length === 0) {
            return;
        }
        clearMessage();
        lockButtons();
        try {
            yield encodedSelectedAPNG(encodeAPNGButton.files[0]);
        }
        finally {
            unlockButtons();
        }
    }));
    encodeGIFButton.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
        if (encodeGIFButton.files.length === 0) {
            return;
        }
        clearMessage();
        lockButtons();
        try {
            yield encodedSelectedGIF(encodeGIFButton.files[0]);
        }
        finally {
            unlockButtons();
        }
    }));
    sampleButton.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        clearMessage();
        lockButtons();
        try {
            yield loadSample();
        }
        finally {
            unlockButtons();
        }
    }));
});
function decodeSelectedFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        stackMessage("Decoding...");
        const memory = {};
        try {
            yield libflif.decode(file, result => showRaw(result, memory));
            stackMessage("Successfully decoded.");
        }
        catch (err) {
            stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
        }
    });
}
function encodeSelectedFile(fileList) {
    return __awaiter(this, void 0, void 0, function* () {
        const nameSplit = splitFileName(fileList[0].name);
        const extUpper = nameSplit.extension.toUpperCase();
        const frames = [];
        for (let file of Array.from(fileList)) {
            stackMessage(`Encoding ${(file.size / 1024).toFixed(2)} KiB ${extUpper} file...`);
            const raw = yield decodeToRaw(file);
            stackMessage(`Decoded ${extUpper} to raw pixels: width=${raw.width} px, height=${raw.height} px, size=${(raw.arrayBuffer.byteLength / 1024).toFixed(2)} KiB`);
            frames.push({
                data: raw.arrayBuffer,
                width: raw.width,
                height: raw.height
            });
        }
        yield encodeCommon(frames, nameSplit.displayName);
    });
}
function encodedSelectedAPNG(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const nameSplit = splitFileName(file.name);
        const extUpper = nameSplit.extension.toUpperCase();
        let exportResult;
        stackMessage(`Encoding ${(file.size / 1024).toFixed(2)} KiB APNG file...`);
        try {
            exportResult = yield APNGExporter.get(file);
            stackMessage(`Decoded to independent frames: width=${exportResult.width} px, height=${exportResult.height} px, frame count=${exportResult.frames.length}, loop count=${exportResult.loopCount}, duration=${exportResult.duration} ms`);
        }
        catch (err) {
            stackMessage(`Decoding failed: ${err.message || "Unspecified error, please check console message."}`);
        }
        const frames = [];
        for (let frame of exportResult.frames) {
            frames.push({
                data: (yield decodeToRaw(frame.blob)).arrayBuffer,
                frameDelay: frame.delay,
                width: exportResult.width,
                height: exportResult.height
            });
        }
        yield encodeCommon(frames, nameSplit.displayName);
    });
}
function encodedSelectedGIF(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const nameSplit = splitFileName(file.name);
        const extUpper = nameSplit.extension.toUpperCase();
        let exportResult;
        stackMessage(`Encoding ${(file.size / 1024).toFixed(2)} KiB GIF file...`);
        try {
            exportResult = yield GIFExporter.get(file);
            stackMessage(`Decoded to independent frames: width=${exportResult.width} px, height=${exportResult.height} px, frame count=${exportResult.frames.length}, duration=${exportResult.duration} ms`);
        }
        catch (err) {
            stackMessage(`Decoding failed: ${err.message || "Unspecified error, please check console message."}`);
        }
        const frames = [];
        for (let frame of exportResult.frames) {
            frames.push({
                data: (yield decodeToRaw(frame.blob)).arrayBuffer,
                frameDelay: frame.delay,
                width: exportResult.width,
                height: exportResult.height
            });
        }
        yield encodeCommon(frames, nameSplit.displayName);
    });
}
function encodeCommon(frames, displayName) {
    return __awaiter(this, void 0, void 0, function* () {
        let encodeResult;
        try {
            encodeResult = yield libflif.encode({ frames });
            stackMessage(`Successfully encoded as ${(encodeResult.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
        }
        catch (err) {
            stackMessage(`Encoding failed: ${err.message || "Unspecified error, please check console message."}`);
        }
        downloaderButton.disabled = false;
        downloader.href = URL.createObjectURL(new Blob([encodeResult]), { oneTimeOnly: true });
        downloader.download = `${displayName}.flif`;
        const memory = {};
        try {
            yield libflif.decode(encodeResult, result => showRaw(result, memory));
            stackMessage("Successfully decoded.");
        }
        catch (err) {
            stackMessage(`Decoding failed: ${err.message || "Unspecified error, please check console message."}`);
        }
    });
}
function loadSample() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("sample/Lenna.flif?0.2.0rc18");
        const arrayBuffer = yield response.arrayBuffer();
        stackMessage("Decoding...");
        const memory = {};
        try {
            yield libflif.decode(arrayBuffer, result => showRaw(result, memory));
            stackMessage("Successfully decoded.");
        }
        catch (err) {
            stackMessage(`Decoding failed: ${err.message || "Unspecified error, please check console message."}`);
        }
    });
}
function show(blob) {
    image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
}
function showRaw(result, memory) {
    return __awaiter(this, void 0, void 0, function* () {
        if (director && director !== memory.director) {
            director.stop();
        }
        if (result.frames.length === 1) {
            show(yield toRawBlob(result.frames[0].data, result.frames[0].width, result.frames[0].height));
        }
        else {
            const frames = [];
            for (let frame of result.frames) {
                frames.push({
                    data: yield toRawBlob(frame.data, frame.width, frame.height),
                    width: frame.width,
                    height: frame.height,
                    frameDelay: frame.frameDelay
                });
            }
            // TODO: replace frames rather than reconstruct
            if (!memory.director) {
                director = memory.director = new AnimationDirector({
                    frames,
                    loop: result.loop
                });
                director.start(frame => show(frame.data));
            }
            else {
                memory.director.alterFrames(frames);
            }
        }
    });
}
function toRawBlob(buffer, width, height) {
    return __awaiter(this, void 0, void 0, function* () {
        decoderCanvas.width = width;
        decoderCanvas.height = height;
        decoderContext.putImageData(new ImageData(new Uint8ClampedArray(buffer), width, height), 0, 0);
        return yield toBlob(decoderCanvas);
    });
}
function toArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = err => reject(err);
        reader.onload = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
    });
}
function decodeToRaw(blob) {
    return __awaiter(this, void 0, void 0, function* () {
        const image = yield new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
        });
        encoderCanvas.width = image.naturalWidth;
        encoderCanvas.height = image.naturalHeight;
        encoderContext.drawImage(image, 0, 0);
        return {
            arrayBuffer: encoderContext.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data.buffer,
            width: image.naturalWidth,
            height: image.naturalHeight
        };
    });
}
function toBlob(canvas) {
    return __awaiter(this, void 0, void 0, function* () {
        if (canvas.toBlob) {
            return new Promise((resolve, reject) => {
                canvas.toBlob(resolve);
            });
        }
        else if (canvas.msToBlob) {
            // not exactly asynchronous but less blocking in loop
            yield new Promise(resolve => setTimeout(resolve, 0));
            return canvas.msToBlob();
        }
    });
}
function clearMessage() {
    message.textContent = "";
}
function splitFileName(filename) {
    const splitted = filename.split('.');
    const extension = splitted.pop();
    const displayName = splitted.join('.');
    return { displayName, extension };
}
function stackMessage(text) {
    const p = document.createElement("p");
    p.textContent = text;
    message.appendChild(p);
}
function lockButtons() {
    decodeButton.disabled = encodeButton.disabled = sampleButton.disabled = encodeAPNGButton.disabled = encodeGIFButton.disabled = true;
}
function unlockButtons() {
    decodeButton.disabled = encodeButton.disabled = sampleButton.disabled = encodeAPNGButton.disabled = encodeGIFButton.disabled = false;
}
//# sourceMappingURL=app.js.map