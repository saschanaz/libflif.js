declare var image: HTMLImageElement;
declare var message: HTMLDivElement;

declare function saveAs(data: Blob | File, filename?: string, disableAutoBOM?: boolean): void;

const decoderCanvas = document.createElement("canvas");
const decoderContext = decoderCanvas.getContext("2d");
const encoderCanvas = document.createElement("canvas");
const encoderContext = encoderCanvas.getContext("2d");

async function decodeSelectedFile(file: Blob) {
  stackMessage("Decoding...");
  try {
    await libflif.decode(file, showRaw);
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage("Decoding failed.");
  }
}
async function encodeSelectedFile(file: Blob) {
  stackMessage(`Encoding ${(file.size / 1024).toFixed(2)} KiB PNG file...`);
  const raw = await decodeToRaw(file);
  stackMessage(`Decoded PNG to raw pixels: width=${raw.width}, height=${raw.height}, size=${raw.arrayBuffer.byteLength}`);
  const result = await libflif.encode(raw.arrayBuffer, raw.width, raw.height);
  saveAs(new Blob([result]), "output.flif");
  stackMessage(`Successfully encoded as ${(result.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
  await libflif.decode(result, showRaw);
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

async function loadSample() {
  const response = await fetch("sample/Lenna.flif?0.2.0rc18");
  const arrayBuffer = await response.arrayBuffer();
  await libflif.decode(arrayBuffer, showRaw);
}
function show(blob: Blob) {
  image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
}
async function showRaw(result: libflif.libflifProgressiveDecodingResult) {
  decoderCanvas.width = result.width;
  decoderCanvas.height = result.height;
  decoderContext.putImageData(
    new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height),
    0, 0
  )
  show(await toBlob(decoderCanvas));
}
function toArrayBuffer(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(blob);
  });
}
async function decodeToRaw(blob: Blob) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = URL.createObjectURL(blob);
  })
  encoderCanvas.width = image.naturalWidth;
  encoderCanvas.height = image.naturalHeight;
  encoderContext.drawImage(image, 0, 0);
  return {
    arrayBuffer: encoderContext.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data.buffer,
    width: image.naturalWidth,
    height: image.naturalHeight
  }
}
async function toBlob(canvas: HTMLCanvasElement) {
  if (canvas.toBlob) {
    return new Promise<Blob>((resolve, reject) => {
      (canvas as any).toBlob((blob: Blob) => resolve(blob));
    });
  }
  else if (canvas.msToBlob) {
    return canvas.msToBlob();
  }
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