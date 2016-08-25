import glob = require("glob");

const cxx = "em++";
const ports = "-s USE_LIBPNG=1 -s USE_ZLIB=1";
const exportedFunctions = "-s EXPORTED_FUNCTIONS=['_iconv_open','_iconv','_iconv_close','_get_errno']";
const optimizations = "-D NDEBUG -O2 -ftree-vectorize";
const libOptimizations = "-D NDEBUG -O2";

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
    "compiler-specific.hpp"
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
    "io.cpp"
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

desc("Build FLIF encoding/decoding tool");
task("flif", [], () => {
    const command = `${cxx} -std=c++11 -D DECODER_ONLY ${ports} ${optimizations} -g0 -Wall ${filesCpp} ${appendDir("flif.cpp")} -o built/flif.js`;
    console.log(command);
    jake.exec([command], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Builds libflif.js");
task("default", ["flif"], () => {
});