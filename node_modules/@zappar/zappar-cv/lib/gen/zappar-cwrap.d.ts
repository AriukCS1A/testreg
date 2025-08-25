import { zappar_cwrap } from "./zappar-native";
export interface Module {
    cwrap: (func: string, retType: "number" | "string" | null, args: ("number" | "string")[]) => ((...args: any[]) => any);
    _malloc: (size: number) => number;
    _free: (data: number) => void;
    setValue: (offset: number, val: number, type: "i8") => void;
    getValue: (offset: number, type: "float") => number;
    UTF8ToString: (offset: number) => string;
    HEAPU8: Uint8Array;
    HEAPF32: Float32Array;
}
export declare function getRuntimeObject(mod: Module): zappar_cwrap;
