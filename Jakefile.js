const jakeExecOptionBag = {
    printStdout: true,
    printStderr: true
};

function asyncExec(cmds) {
    return new Promise((resolve, reject) => {
        try {
            jake.exec(cmds, () => resolve(), jakeExecOptionBag)
        }
        catch (e) {
            reject(e);
        }
    });
}

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

desc("Build Jakefile-main.js");
task("main", async () => {
    await asyncExec(["tsc"]);
});

desc("Build JavaScript part");
task("js", ["wrapper", "worker", "sample", "main"], () => {

});

desc("Run Jakefile-main.js");
task("cpp", ["main"], async () => {
    console.log("Building FLIF...");
    await asyncExec(["jake -f Jakefile-main.js libflif"]);
});

desc("Run Jakefile-main.js");
task("cppdec", ["main"], async () => {
    console.log("Building FLIF decoder-only...");
    await asyncExec(["jake -f Jakefile-main.js libflifdec"]);
});

desc("Run Jakefile-main.js");
task("default", ["js", "cpp", "cppdec"], () => {

});

desc("Clean");
task("clean", [], async () => {
    console.log("Cleaning...");
    await asyncExec(["rm -r built/"]);
});