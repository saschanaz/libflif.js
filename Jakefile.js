const jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
const jakeAsyncTaskOptionBag = {
    async: true
};

desc("Build wrapper");
task("wrapper", [], () => {
    console.log("Building wrapper...");
    jake.exec(["tsc -p wrapper/tsconfig.json"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build worker for wrapper");
task("worker", [], () => {
    console.log("Building worker...");
    jake.exec(["tsc -p wrapper-worker/tsconfig.json"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build sample app");
task("sample", [], () => {
    console.log("Building sample app...");
    jake.exec(["tsc -p sample/tsconfig.json"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build Jakefile-main.js");
task("main", [], () => {
    jake.exec(["tsc"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);

desc("Build JavaScript part");
task("js", ["wrapper", "worker", "sample", "main"], () => {

});

desc("Run Jakefile-main.js");
task("default", ["js"], () => {
    console.log("Building FLIF...");
    jake.exec(["jake -f Jakefile-main.js"], () => {
        complete();
    }, jakeExecOptionBag);
}, jakeAsyncTaskOptionBag);