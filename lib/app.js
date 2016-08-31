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
function decodeSelectedFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        stackMessage("Decoding...");
        try {
            const memory = {};
            yield libflif.decode(file, result => showRaw(result, memory));
            stackMessage("Successfully decoded.");
        }
        catch (err) {
            stackMessage("Decoding failed.");
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
        encodeResult = yield libflif.encode({ frames });
        downloaderButton.disabled = false;
        downloader.href = URL.createObjectURL(new Blob([encodeResult]), { oneTimeOnly: true });
        downloader.download = `${nameSplit.displayName}.flif`;
        stackMessage(`Successfully encoded as ${(encodeResult.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
        const memory = {};
        yield libflif.decode(encodeResult, result => showRaw(result, memory));
        // var blob;
        // JxrLib.encodeAsBlob(file)
        //   .catch(function () {
        //     stackMessage("JxrLib cannot open this file. Fallbacking to the browser native... Try BMP file if this fails.");
        //     return tryDrawing(file)
        //       .then(function (url) {
        //         if (url)
        //           return download(url).then(function (array) { return JxrLib.encodeAsBlob(array, { inputType: "bmp" }); });
        //         else
        //           throw new Error();
        //       });
        //   })
        //   .then(function (_blob) {
        //     blob = _blob;
        //     return JxrLib.isNativelySupported();
        //   })
        //   .then(function (isNative) {
        //     if (isNative) {
        //       stackMessage("Successfully encoded.");
        //       return show(blob);
        //     }
        //     else {
        //       stackMessage("Successfully encoded and now decoding again by JxrLib....");
        //       return decodeSelectedFile(blob);
        //     }
        //   })
        //   .catch(function () { stackMessage("Encoding failed."); });
    });
}
function loadSample() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("sample/Lenna.flif?0.2.0rc18");
        const arrayBuffer = yield response.arrayBuffer();
        const memory = {};
        yield libflif.decode(arrayBuffer, result => showRaw(result, memory));
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
                canvas.toBlob((blob) => resolve(blob));
            });
        }
        else if (canvas.msToBlob) {
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
//# sourceMappingURL=app.js.map