declare var image: HTMLImageElement;
declare var message: HTMLDivElement;
declare var downloader: HTMLAnchorElement;
declare var downloaderButton: HTMLInputElement;
declare var encodeResult: ArrayBuffer;

const decoderCanvas = document.createElement("canvas");
const decoderContext = decoderCanvas.getContext("2d");
const encoderCanvas = document.createElement("canvas");
const encoderContext = encoderCanvas.getContext("2d");
let director: AnimationDirector;

async function decodeSelectedFile(file: File) {
  stackMessage("Decoding...");
  try {
    await libflif.decode(file, showRaw);
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage("Decoding failed.");
  }
}
async function encodeSelectedFile(fileList: FileList) {
  const nameSplit = splitFileName(fileList[0].name);
  const extUpper = nameSplit.extension.toUpperCase();

  const frames: libflifFrame[] = [];
  for (let file of Array.from(fileList)) {
    stackMessage(`Encoding ${(file.size / 1024).toFixed(2)} KiB ${extUpper} file...`);
    const raw = await decodeToRaw(file);
    stackMessage(`Decoded ${extUpper} to raw pixels: width=${raw.width} px, height=${raw.height} px, size=${(raw.arrayBuffer.byteLength / 1024).toFixed(2)} KiB`);
    frames.push({
      data: raw.arrayBuffer,
      width: raw.width,
      height: raw.height
    });
  }
  encodeResult = await libflif.encode({ frames });
  downloaderButton.disabled = false;
  downloader.href = URL.createObjectURL(new Blob([encodeResult]), { oneTimeOnly: true });
  (downloader as any).download = `${nameSplit.displayName}.flif`;
  stackMessage(`Successfully encoded as ${(encodeResult.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
  await libflif.decode(encodeResult, showRaw);
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

async function showRaw(result: libflifProgressiveDecodingResult) {
  if (director) {
    director.stop();
  }
  if (result.frames.length === 1) {
    show(await toRawBlob(result.frames[0].data, result.frames[0].width, result.frames[0].height));
  }
  else {
    const frames: AnimatedFrame[] = [];
    for (let frame of result.frames) {
      frames.push({
        data: await toRawBlob(frame.data, frame.width, frame.height),
        width: frame.width,
        height: frame.height,
        frameDelay: frame.frameDelay
      })
    }

    director = new AnimationDirector({
      frames,
      loop: result.loop
    })
    director.start(frame => show(frame.data));
  }
}

async function toRawBlob(buffer: ArrayBuffer, width: number, height: number) {
  decoderCanvas.width = width;
  decoderCanvas.height = height;
  decoderContext.putImageData(
    new ImageData(new Uint8ClampedArray(buffer), width, height),
    0, 0
  )
  return await toBlob(decoderCanvas);
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
    image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
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

function splitFileName(filename: string) {
  const splitted = filename.split('.');
  const extension = splitted.pop();
  const displayName = splitted.join('.');
  return { displayName, extension }
}

function stackMessage(text: string) {
  const p = document.createElement("p");
  p.textContent = text;
  message.appendChild(p);
}