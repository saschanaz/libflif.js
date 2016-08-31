declare var image: HTMLImageElement;
declare var message: HTMLDivElement;
declare var downloader: HTMLAnchorElement;
declare var downloaderButton: HTMLInputElement;
declare var decodeButton: HTMLInputElement;
declare var encodeButton: HTMLInputElement;
declare var encodeAnimationButton: HTMLInputElement;
declare var sampleButton: HTMLInputElement;

const decoderCanvas = document.createElement("canvas");
const decoderContext = decoderCanvas.getContext("2d");
const encoderCanvas = document.createElement("canvas");
const encoderContext = encoderCanvas.getContext("2d");
let director: AnimationDirector;

libflif.startWorker();

document.addEventListener("DOMContentLoaded", () => {
  decodeButton.addEventListener("change", async () => {
    if (decodeButton.files.length === 0) {
      return;
    }
    clearMessage();
    lockButtons();
    try {
      await decodeSelectedFile(decodeButton.files[0])
    }
    finally {
      unlockButtons();
    }
  });
  encodeButton.addEventListener("change", async () => {
    if (encodeButton.files.length === 0) {
      return;
    }
    clearMessage();
    lockButtons();
    try {
      await encodeSelectedFile(encodeButton.files)
    }
    finally {
      unlockButtons();
    }
  });
  encodeAnimationButton.addEventListener("change", async () => {
    if (encodeAnimationButton.files.length === 0) {
      return;
    }
    clearMessage();
    lockButtons();
    try {
      await encodedSelectedAnimation(encodeAnimationButton.files[0]);
    }
    finally {
      unlockButtons();
    }
  });
  sampleButton.addEventListener("click", async () => {
    lockButtons();
    try {
      await loadSample();
    }
    finally {
      unlockButtons();
    }
  })
})

async function decodeSelectedFile(file: File) {
  stackMessage("Decoding...");
  const memory: DecodeMemory = {};
  try {
    await libflif.decode(file, result => showRaw(result, memory));
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
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

  let encodeResult: ArrayBuffer;
  try {
    encodeResult = await libflif.encode({ frames });
    stackMessage(`Successfully encoded as ${(encodeResult.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
  }
  catch (err) {
    stackMessage(`Encoding failed: ${err.message || "Unspecified error"}`);
  }
  downloaderButton.disabled = false;
  downloader.href = URL.createObjectURL(new Blob([encodeResult]), { oneTimeOnly: true });
  (downloader as any).download = `${nameSplit.displayName}.flif`;
  const memory: DecodeMemory = {};
  try {
    await libflif.decode(encodeResult, result => showRaw(result, memory));
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
  }
}

async function encodedSelectedAnimation(file: File) {
  const nameSplit = splitFileName(file.name);
  const extUpper = nameSplit.extension.toUpperCase();
  let exportResult: APNGExporter.IndependentExportResult;
  try {
    exportResult = await APNGExporter.get(file);
    stackMessage(`Decoded: width=${exportResult.width} px, height=${exportResult.height} px, loop count=${exportResult.loopCount}, duration=${exportResult.duration}`);
  }
  catch (err) {
    stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
  }

  const frames: libflifFrame[] = [];
  for (let frame of exportResult.frames) {
    frames.push({
      data: (await decodeToRaw(frame.blob)).arrayBuffer,
      frameDelay: frame.delay,
      width: exportResult.width,
      height: exportResult.height
    });
  }

  let encodeResult: ArrayBuffer;
  try {
    encodeResult = await libflif.encode({ frames, loop: exportResult.loopCount });
    stackMessage(`Successfully encoded as ${(encodeResult.byteLength / 1024).toFixed(2)} KiB FLIF file and now decoding again by libflif.js....`);
  }
  catch (err) {
    stackMessage(`Encoding failed: ${err.message || "Unspecified error"}`);
  }

  downloaderButton.disabled = false;
  downloader.href = URL.createObjectURL(new Blob([encodeResult]), { oneTimeOnly: true });
  (downloader as any).download = `${nameSplit.displayName}.flif`;
  const memory: DecodeMemory = {};
  try {
    await libflif.decode(encodeResult, result => showRaw(result, memory));
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
  }
}

async function loadSample() {
  const response = await fetch("sample/Lenna.flif?0.2.0rc18");
  const arrayBuffer = await response.arrayBuffer();

  stackMessage("Decoding...");
  const memory: DecodeMemory = {};
  try {
    await libflif.decode(arrayBuffer, result => showRaw(result, memory));
    stackMessage("Successfully decoded.");
  }
  catch (err) {
    stackMessage(`Decoding failed: ${err.message || "Unspecified error"}`);
  }
}

function show(blob: Blob) {
  image.src = URL.createObjectURL(blob, { oneTimeOnly: true });
}

interface DecodeMemory {
  director?: AnimationDirector
}
async function showRaw(result: libflifProgressiveDecodingResult, memory: DecodeMemory) {
  if (director && director !== memory.director) {
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

    // TODO: replace frames rather than reconstruct
    if (!memory.director) {
      director = memory.director = new AnimationDirector({
        frames,
        loop: result.loop
      })
      director.start(frame => show(frame.data));
    }
    else {
      memory.director.alterFrames(frames);
    }
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
    reader.onerror = err => reject(err);
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

function lockButtons() {
  decodeButton.disabled = encodeButton.disabled = sampleButton.disabled = true;
}

function unlockButtons() {
  decodeButton.disabled = encodeButton.disabled = sampleButton.disabled = false;
}