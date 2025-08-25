export interface Chunk {
    ident: string;
    data: Uint8Array;
    subident?: string;
    subchunks?: Chunk[];
}
export declare class RiffReader {
    private _data;
    private _paddingBytes;
    truncatedChunks: boolean;
    private _view;
    root: Chunk;
    constructor(_data: ArrayBuffer, _paddingBytes?: boolean);
    private _parse;
    private _parseChunk;
    find(str: string, inChunk?: Chunk): Chunk | undefined;
    has(str: string): boolean;
}
