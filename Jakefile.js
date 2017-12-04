const glob = require("glob");
const fs = require("fs");

const cxx = "em++";
const exportName = "-s EXPORT_NAME='_libflifem' -s MODULARIZE=1";
const ports = "-s USE_LIBPNG=1 -s USE_ZLIB=1";
const bind = "--bind wrapper/bind.cpp";
const optimizations = "-D NDEBUG -O2 -ftree-vectorize";
const flags = "-D LODEPNG_NO_COMPILE_PNG -D LODEPNG_NO_COMPILE_DISK";
const misc = "-s ALLOW_MEMORY_GROWTH=1 -s DEMANGLE_SUPPORT=1"
const commandMisc = `${misc} -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS']`;
const libMisc = `${misc} -s RESERVED_FUNCTION_POINTERS=20 -s NO_FILESYSTEM=1 -s WASM=1 -s NO_EXIT_RUNTIME=1 -s BINARYEN_METHOD='native-wasm,asmjs'`;
const libdecMisc = `${libMisc} -D DECODER_ONLY`;
const libOptimizations = "-D NDEBUG -Oz --llvm-lto 1 -s USE_SDL=0";

const libraryInclude = `-I ${appendDir("library/")}`

// copied file list on the upstream makefile
// JSON.stringify((list).split(" "), null, 4)
const filesH = [
    ...glob.sync("maniac/*.hpp"),
    ...glob.sync("maniac/*.cpp"),
    ...glob.sync("image/*.hpp"),
    ...glob.sync("transform/*.hpp"),
    "flif-enc.hpp",
    "flif-dec.hpp",
    "common.hpp",
    "flif_config.h",
    "fileio.hpp",
    "io.hpp",
    "io.cpp",
    "config.h",
    "compiler-specific.hpp",
    "../extern/lodepng.h"
].map(item => appendDir(item)).join(' ');
const filesCpp = [
    "maniac/chance.cpp",
    "maniac/symbol.cpp",
    "image/crc32k.cpp",
    "image/image.cpp",
    "image/image-png.cpp",
    "image/image-pnm.cpp",
    "image/image-pam.cpp",
    "image/image-rggb.cpp",
    "image/image-metadata.cpp",
    "image/color_range.cpp",
    "transform/factory.cpp",
    "common.cpp",
    "flif-enc.cpp",
    "flif-dec.cpp",
    "io.cpp",
    "../extern/lodepng.cpp"
].map(item => appendDir(item)).join(' ');
const libFilesCpp = [
    "maniac/chance.cpp",
    "maniac/symbol.cpp",
    "image/crc32k.cpp",
    "image/image.cpp",
    "image/color_range.cpp",
    "transform/factory.cpp",
    "common.cpp",
    "flif-enc.cpp",
    "flif-dec.cpp",
    "io.cpp",
].map(item => appendDir(item)).join(' ');

/** @param {string} path */
function appendDir(path) {
    return `submodules/flif/src/${path}`;
}

/** @type {jake.ExecOptions} */
const jakeExecOptionBag = {
    printStdout: true,
    printStderr: true
};

/**
 * @param {string[]} cmds
 * @return {Promise<void>}
 */
function asyncExec(cmds) {
    return new Promise((resolve, reject) => {
        try {
            jake.exec(cmds, resolve, jakeExecOptionBag);
        }
        catch (e) {
            reject(e);
        }
    });
}

desc("Build libflif");
task("lib", async () => {
    const command = `${cxx} ${flags} ${libMisc} -std=c++11 ${bind} ${exportName} ${ports} ${libOptimizations} -g0 -Wall ${libraryInclude} ${libFilesCpp} ${appendDir("library/flif-interface.cpp")} -o built/libflif.js`;
    console.log(command);
    await asyncExec([command]);
});

desc("Build libflifdec");
task("libdec", async () => {
    const command = `${cxx} ${flags} ${libdecMisc} -std=c++11 ${bind} ${exportName} ${ports} ${libOptimizations} -g0 -Wall ${libraryInclude} ${libFilesCpp} ${appendDir("library/flif-interface_dec.cpp")} -o built/libflifdec.js`;
    console.log(command);
    await asyncExec([command]);
});

desc("Build wrapper");
task("wrapper", async () => {
    console.log("Building wrapper...");
    await asyncExec(["tsc -p wrapper/tsconfig.json"]);
});

desc("Build worker for wrapper");
task("worker", async () => {
    console.log("Building worker...");
    await asyncExec(["tsc -p wrapper-worker/tsconfig.json"]);
});

desc("Build sample app");
task("sample", async () => {
    console.log("Building sample app...");
    await asyncExec(["tsc -p sample/tsconfig.json"]);
});

desc("Build JavaScript part");
task("js", ["wrapper", "worker", "sample"]);

desc("Build all");
task("default", ["js", "lib", "libdec"]);

desc("Clean");
task("clean", [], () => {
    console.log("Cleaning...");
    fs.unlink("built/");
});
