const decoder = new TextDecoder();
export class RiffReader {
    constructor(_data, _paddingBytes = false) {
        this._data = _data;
        this._paddingBytes = _paddingBytes;
        this.truncatedChunks = false;
        this._view = new DataView(this._data);
        this.root = this._parse();
    }
    _parse() {
        const header = decoder.decode(this._data.slice(0, 4));
        if (header !== "RIFF")
            throw new Error("Not a valid ZPT file");
        return this._parseChunk(0);
    }
    _parseChunk(offset) {
        const ident = decoder.decode(this._data.slice(offset, offset + 4));
        const length = this._view.getUint32(offset + 4, true);
        const data = new Uint8Array(this._data, offset + 8, length);
        if (data.byteLength !== length)
            this.truncatedChunks = true;
        let subchunks;
        let subident;
        if (ident === "RIFF" || ident === "LIST") {
            subident = decoder.decode(this._data.slice(offset + 8, offset + 12));
            subchunks = [];
            let currentOffset = 4;
            while (currentOffset < data.byteLength - 1) {
                const subchunk = this._parseChunk(offset + 8 + currentOffset);
                subchunks.push(subchunk);
                currentOffset += subchunk.data.byteLength + 8;
                if (this._paddingBytes && subchunk.data.byteLength & 0x1)
                    currentOffset++;
            }
        }
        return { ident, data, subident, subchunks };
    }
    find(str, inChunk = this.root) {
        if (inChunk.ident === str)
            return inChunk;
        if (!inChunk.subchunks)
            return;
        for (let c of inChunk.subchunks) {
            const found = this.find(str, c);
            if (found)
                return found;
        }
    }
    has(str) {
        return this.find(str) !== undefined;
    }
}
