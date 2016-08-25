const jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
const jakeAsyncTaskOptionBag = {
    async: true
};

desc("Build Jakefile-main.js");
task("tsc", [], () => {
    jake.exec(["tsc"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("Run Jakefile-main.js");
task("default", ["tsc"], () => {
    jake.exec(["jake -f Jakefile-main.js"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);