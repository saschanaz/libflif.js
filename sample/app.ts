declare var image: HTMLImageElement;
declare var message: HTMLDivElement;

declare function saveAs(data: Blob|File, filename?: string, disableAutoBOM?: boolean): void;

const decoderCanvas = document.createElement("canvas");
const decoderContext = decoderCanvas.getContext("2d");

async function decodeSelectedFile(file: Blob) {
  stackMessage("Decoding...");
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
  show(new Blob([decode(arrayBuffer)]));
  // JxrLib.decodeAsBlob(file).then(show)
  //   .then(function () { stackMessage("Successfully decoded."); })
  //   .catch(function () { stackMessage("Decoding failed."); });
}
function decodeArrayBuffer(arrayBuffer: ArrayBuffer) {
  stackMessage("Decoding...");
  show(new Blob([decode(arrayBuffer)]));
  // JxrLib.decodeAsBlob(file).then(show)
  //   .then(function () { stackMessage("Successfully decoded."); })
  //   .catch(function () { stackMessage("Decoding failed."); });
}
async function encodeSelectedFile(file: Blob) {
  stackMessage("Encoding...");
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
  const result = encode(arrayBuffer);
  saveAs(new Blob([result]), "output.flif");
  stackMessage("Successfully encoded and now decoding again by libflif.js....");
  show(new Blob([decode(result.buffer)]));
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
}
function encodeArrayBuffer(arrayBuffer: ArrayBuffer) {
  stackMessage("Encoding...");
  const result = encode(arrayBuffer);
  stackMessage("Successfully encoded and now decoding again by libflif.js....");
  show(new Blob([decode(result.buffer)]));
}

async function loadSample() {
  const response = await fetch("sample/Lenna.flif");
  await decodeArrayBuffer(await response.arrayBuffer()); // stream!
}
function show(blob: Blob) {
  image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
}
function clearMessage() {
  message.textContent = "";
}
function stackMessage(text: string) {
  if (message.textContent.length > 0) {
    message.textContent += " ";
  }
  message.textContent += text;
}