export class MessageDeserializer {
    constructor() {
        this._buffer = new ArrayBuffer(0);
        this._i32View = new Int32Array(this._buffer);
        this._f32View = new Float32Array(this._buffer);
        this._f64View = new Float64Array(this._buffer);
        this._u8View = new Uint8Array(this._buffer);
        this._u16View = new Uint16Array(this._buffer);
        this._u32View = new Uint32Array(this._buffer);
        this._offset = 0;
        this._length = 0;
        this._startOffset = -1;
        this._processor = {
            int: () => this._i32View[this._startOffset++],
            bool: () => (this._i32View[this._startOffset++] === 1),
            type: () => this._i32View[this._startOffset++],
            float: () => this._f32View[this._startOffset++],
            timestamp: () => {
                if (this._startOffset % 2 === 1)
                    this._startOffset++;
                let ret = this._f64View[this._startOffset / 2];
                this._startOffset += 2;
                return ret;
            },
            string: () => {
                let len = this._i32View[this._startOffset++];
                let decoder = new TextDecoder();
                let res = decoder.decode(new Uint8Array(this._buffer, this._startOffset * 4, len));
                this._startOffset += (len >> 2);
                if ((len & 3) !== 0)
                    this._startOffset++;
                return res;
            },
            dataWithLength: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Uint8Array(len);
                ret.set(this._u8View.subarray(this._startOffset * 4, this._startOffset * 4 + len));
                this._startOffset += (ret.byteLength >> 2);
                if ((ret.byteLength & 3) !== 0)
                    this._startOffset++;
                return ret.buffer;
            },
            matrix4x4: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Float32Array(len);
                ret.set(this._f32View.subarray(this._startOffset, this._startOffset + 16));
                this._startOffset += len;
                return ret;
            },
            matrix3x3: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Float32Array(len);
                ret.set(this._f32View.subarray(this._startOffset, this._startOffset + 9));
                this._startOffset += len;
                return ret;
            },
            identityCoefficients: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Float32Array(len);
                ret.set(this._f32View.subarray(this._startOffset, this._startOffset + 50));
                this._startOffset += len;
                return ret;
            },
            expressionCoefficients: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Float32Array(len);
                ret.set(this._f32View.subarray(this._startOffset, this._startOffset + 29));
                this._startOffset += len;
                return ret;
            },
            cameraModel: () => {
                let len = this._i32View[this._startOffset++];
                let ret = new Float32Array(len);
                ret.set(this._f32View.subarray(this._startOffset, this._startOffset + 6));
                this._startOffset += len;
                return ret;
            },
            barcodeFormat: () => this._i32View[this._startOffset++],
            faceLandmarkName: () => this._i32View[this._startOffset++],
            instantTrackerTransformOrientation: () => this._i32View[this._startOffset++],
            logLevel: () => this._i32View[this._startOffset++],
        };
    }
    setData(data) {
        this._buffer = data;
        this._i32View = new Int32Array(this._buffer);
        this._f32View = new Float32Array(this._buffer);
        this._f64View = new Float64Array(this._buffer);
        this._u8View = new Uint8Array(this._buffer);
        this._u16View = new Uint16Array(this._buffer);
        this._u32View = new Uint32Array(this._buffer);
        this._offset = 0;
        this._length = 0;
        if (data.byteLength >= 4) {
            this._offset = 1;
            this._length = this._i32View[0];
        }
        this._startOffset = -1;
    }
    hasMessage() {
        return this._offset + 1 < this._length;
    }
    forMessages(cb) {
        while (this.hasMessage()) {
            let len = this._i32View[this._offset];
            let messageId = this._i32View[this._offset + 1];
            this._startOffset = this._offset + 2;
            this._offset += len;
            cb(messageId, this._processor);
        }
    }
}
