declare enum EmscriptenMemoryAllocator { }
declare var ALLOC_STATIC: EmscriptenMemoryAllocator;
declare var ALLOC_STACK: EmscriptenMemoryAllocator;
declare var ALLOC_NORMAL: EmscriptenMemoryAllocator;
declare var ALLOC_NONE: EmscriptenMemoryAllocator;
declare var ALLOC_DYNAMIC: EmscriptenMemoryAllocator;

interface EmscriptenModule {
    allocate(slab: any[], types: string[], allocator: EmscriptenMemoryAllocator): number;
    allocate(slab: any[], types: string, allocator: EmscriptenMemoryAllocator): number;
    allocate(slab: number, types: any, allocator: EmscriptenMemoryAllocator): number;

    intArrayFromString(stringy: string, dontAddNull: boolean, length?: number): number[];

    ccall(ident: string, returnType: string, argTypes: string[], args: any[]): any;

    _free(byteOffset: number): void;
    _malloc(size: number): number;

    callMain(args: string[]): void;

    HEAP8: Int8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;

    FS: FS;
    Runtime: Runtime;
}

interface EmscriptenClass {
    delete(): void;
    clone(): this;
    isAliasOf(other: any): boolean;
    isDeleted(): boolean;
}

interface FS {
    syncfs(populate: boolean, callback: (err: any) => any): void;
    writeFile(path: string, data: ArrayBufferView, opts?: IOOptionBag): void;
    readFile(path: string): Uint8Array;
    readFile(path: string, opts: IOOptionStringBag): string;
    readFile(path: string, opts: IOOptionBag): Uint8Array;
    unlink(path: string): void;
}

interface Runtime {
    addFunction(func: Function): number;
    removeFunction(funcPointer: number): void;
}

interface IOOptionBag {
    encoding?: "binary";
    flags?: string;
}

interface IOOptionStringBag {
    encoding: "utf8";
    flags?: string;
}