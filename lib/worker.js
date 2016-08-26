// This should later be a Web Worker, currently this is just a normal script 
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const libflifem = _libflifem();
function convert(input) {
    libflifem.FS.writeFile("input.flif", new Uint8Array(input), { encoding: "binary" });
    libflifem.callMain(["-d", "input.flif", "output.png"]);
    return libflifem.FS.readFile("output.png");
}
var EmscriptenUtility;
(function (EmscriptenUtility) {
    function allocateString(em, input) {
        var array = em.intArrayFromString(input, false);
        var pointer = em._malloc(array.length);
        em.HEAP8.set(new Int8Array(array), pointer);
        return pointer;
    }
    function allocateStringArray(em, input) {
        var array = [];
        input.forEach(item => array.push(allocateString(em, item)));
        var pointer = em._malloc(array.length * 4);
        em.HEAP32.set(new Int32Array(array), pointer / 4);
        return {
            content: array,
            pointer: pointer
        };
    }
    EmscriptenUtility.allocateStringArray = allocateStringArray;
    function deleteStringArray(em, input) {
        input.content.forEach((item) => em._free(item));
        em._free(input.pointer);
    }
    EmscriptenUtility.deleteStringArray = deleteStringArray;
})(EmscriptenUtility || (EmscriptenUtility = {}));
var EmscriptenUtility;
(function (EmscriptenUtility) {
    var FileSystem;
    (function (FileSystem) {
        function writeBlob(em, path, blob) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsArrayBuffer(blob);
                });
                em.FS.writeFile(path, new Uint8Array(result), { encoding: "binary" });
            });
        }
        FileSystem.writeBlob = writeBlob;
    })(FileSystem = EmscriptenUtility.FileSystem || (EmscriptenUtility.FileSystem = {}));
})(EmscriptenUtility || (EmscriptenUtility = {}));
