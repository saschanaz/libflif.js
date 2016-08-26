const jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
const jakeAsyncTaskOptionBag = {
    async: true
};

desc("Build sample app");
task("sample", [], () => {
    jake.exec(["tsc -p sample/tsconfig.json"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build Jakefile-main.js");
task("tsc", [], () => {
    jake.exec(["tsc"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Run Jakefile-main.js");
task("default", ["tsc", "sample"], () => {
    jake.exec(["jake -f Jakefile-main.js"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);