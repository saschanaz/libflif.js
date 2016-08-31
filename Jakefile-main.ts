import glob = require("glob");
import fs = require("fs");

const cxx = "em++";
const exportName = "-s EXPORT_NAME='_libflifem' -s MODULARIZE=1";
const ports = "-s USE_LIBPNG=1 -s USE_ZLIB=1";
const bind = "--bind wrapper/bind.cpp";
const optimizations = "-D NDEBUG -O2 -ftree-vectorize"; // disable -O2 temporarily (emscripten #4519)
const flags = "-D LODEPNG_NO_COMPILE_PNG -D LODEPNG_NO_COMPILE_DISK";
const misc = "-s TOTAL_MEMORY=134217728 -s DEMANGLE_SUPPORT=1"
const commandMisc = `${misc} -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS']`;
const libMisc = `${misc} -s RESERVED_FUNCTION_POINTERS=20 -s NO_FILESYSTEM=1`;
const libOptimizations = "-D NDEBUG -Oz --llvm-lto 1 -s USE_SDL=0 -s ELIMINATE_DUPLICATE_FUNCTIONS=1"; // disable -O2 temporarily (emscripten #4519)

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
    // "../extern/lodepng.h"
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
    // "../extern/lodepng.cpp"
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

function appendDir(path: string) {
    return `submodules/flif/src/${path}`;
}

const jakeExecOptionBag: jake.ExecOptions = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
const jakeAsyncTaskOptionBag: jake.TaskOptions = {
    async: true
};

desc("Build FLIF command-line encoding/decoding tool");
task("commandline", [], () => {
    const command = `${cxx} ${flags} -s INVOKE_RUN=0 ${commandMisc} -std=c++11 ${bind} ${exportName} ${ports} ${optimizations} -g0 -Wall ${filesCpp} ${appendDir("flif.cpp")} -o built/flif.js`;
    console.log(command);
    jake.exec([command], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build libflif");
task("libflif", [], () => {
    const command = `${cxx} ${flags} ${libMisc} -std=c++11 ${bind} ${exportName} ${ports} ${libOptimizations} -g0 -Wall ${libraryInclude} ${libFilesCpp} ${appendDir("library/flif-interface.cpp")} -o built/libflif.js`;
    console.log(command);
    jake.exec([command], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Builds libflif.js");
task("default", ["commandline"], () => {

});