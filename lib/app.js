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
function decodeSelectedFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        stackMessage("Decoding...");
        const arrayBuffer = yield new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(file);
        });
        show(new Blob([convert(arrayBuffer)]));
        // JxrLib.decodeAsBlob(file).then(show)
        //   .then(function () { stackMessage("Successfully decoded."); })
        //   .catch(function () { stackMessage("Decoding failed."); });
    });
}
function decodeArrayBuffer(arrayBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        stackMessage("Decoding...");
        show(new Blob([convert(arrayBuffer)]));
        // JxrLib.decodeAsBlob(file).then(show)
        //   .then(function () { stackMessage("Successfully decoded."); })
        //   .catch(function () { stackMessage("Decoding failed."); });
    });
}
function encodeSelectedFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        stackMessage("Encoding...");
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
        const response = yield fetch("sample/Lenna.flif");
        yield decodeArrayBuffer(yield response.arrayBuffer()); // stream!
    });
}
function show(blob) {
    image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
}
function clearMessage() {
    message.textContent = "";
}
function stackMessage(text) {
    if (message.textContent.length > 0) {
        message.textContent += " ";
    }
    message.textContent += text;
}
