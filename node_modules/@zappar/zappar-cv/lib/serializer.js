export class MessageSerializer {
    constructor(_messageSender) {
        this._messageSender = _messageSender;
        this._freeBufferPool = [];
        this._buffer = new ArrayBuffer(16);
        this._i32View = new Int32Array(this._buffer);
        this._f32View = new Float32Array(this._buffer);
        this._f64View = new Float64Array(this._buffer);
        this._u8View = new Uint8Array(this._buffer);
        this._u8cView = new Uint8ClampedArray(this._buffer);
        this._u16View = new Uint16Array(this._buffer);
        this._u32View = new Uint32Array(this._buffer);
        this._offset = 1;
        this._startOffset = -1;
        this._timeoutSet = false;
        this._appender = {
            int: i => this.int(i),
            bool: i => this.int(i ? 1 : 0),
            float: i => this.float(i),
            string: i => this.string(i),
            dataWithLength: i => this.arrayBuffer(i),
            type: i => this.int(i),
            matrix4x4: i => this.float32ArrayBuffer(i),
            matrix3x3: i => this.float32ArrayBuffer(i),
            identityCoefficients: i => this.float32ArrayBuffer(i),
            expressionCoefficients: i => this.float32ArrayBuffer(i),
            cameraModel: i => this.float32ArrayBuffer(i),
            timestamp: i => this.double(i),
            barcodeFormat: i => this.int(i),
            faceLandmarkName: i => this.int(i),
            instantTrackerTransformOrientation: i => this.int(i),
            logLevel: i => this.int(i),
        };
        this._freeBufferPool.push(new ArrayBuffer(16));
        this._freeBufferPool.push(new ArrayBuffer(16));
    }
    bufferReturn(ab) {
        this._freeBufferPool.push(ab);
    }
    // public copySerializedData(): ArrayBuffer {
    //     let data = this._buffer.slice(0, this._offset * Int32Array.BYTES_PER_ELEMENT);
    //     this._offset = 0;
    //     this._startOffset = -1;
    //     return data;
    // }
    _ensureArrayBuffer(incremental) {
        let requirement = (this._offset + incremental + 8) * 4;
        if (this._buffer && this._buffer.byteLength >= requirement)
            return;
        let newBuffer = undefined;
        // for (let i = 0; i < this._freeBufferPool.length; i++) {
        //     if (this._freeBufferPool[i].byteLength > requirement) {
        //         newBuffer = this._freeBufferPool[i];
        //         this._freeBufferPool.splice(i, 1);
        //         break;
        //     }
        // }
        if (!newBuffer) {
            let nextPow2 = requirement;
            nextPow2--;
            nextPow2 |= nextPow2 >> 1;
            nextPow2 |= nextPow2 >> 2;
            nextPow2 |= nextPow2 >> 4;
            nextPow2 |= nextPow2 >> 8;
            nextPow2 |= nextPow2 >> 16;
            nextPow2++;
            newBuffer = new ArrayBuffer(nextPow2);
        }
        let oldView = this._buffer ? this._i32View : undefined;
        this._buffer = newBuffer;
        this._i32View = new Int32Array(this._buffer);
        this._f32View = new Float32Array(this._buffer);
        this._f64View = new Float64Array(this._buffer);
        this._u8View = new Uint8Array(this._buffer);
        this._u8cView = new Uint8ClampedArray(this._buffer);
        this._u16View = new Uint16Array(this._buffer);
        this._u32View = new Uint32Array(this._buffer);
        if (oldView)
            this._i32View.set(oldView.subarray(0, this._offset));
        // this._offset = 1; // First int is whole length
        // this._startOffset = -1;
    }
    sendMessage(messageId, cb) {
        this._ensureArrayBuffer(4);
        this._startOffset = this._offset;
        this._i32View[this._offset + 1] = messageId;
        this._offset += 2;
        cb(this._appender);
        this._i32View[this._startOffset] = this._offset - this._startOffset;
        this._startOffset = -1;
        this._sendOneTime();
    }
    _sendOneTime() {
        if (this._timeoutSet === false) {
            this._timeoutSet = true;
            setTimeout(() => {
                this._timeoutSet = false;
                this._send();
            }, 0);
        }
    }
    _send() {
        // Continue filling the current buffer unless have a new buffer to fill
        if (this._freeBufferPool.length === 0) {
            this._sendOneTime();
            return;
        }
        this._i32View[0] = this._offset;
        this._messageSender(this._buffer);
        this._buffer = undefined;
        this._buffer = this._freeBufferPool.pop();
        this._i32View = new Int32Array(this._buffer);
        this._f32View = new Float32Array(this._buffer);
        this._f64View = new Float64Array(this._buffer);
        this._u8View = new Uint8Array(this._buffer);
        this._u8cView = new Uint8ClampedArray(this._buffer);
        this._u16View = new Uint16Array(this._buffer);
        this._u32View = new Uint32Array(this._buffer);
        this._offset = 1;
        this._startOffset = -1;
    }
    int(arg) {
        this._ensureArrayBuffer(1);
        this._i32View[this._offset] = arg;
        this._offset++;
    }
    double(arg) {
        this._ensureArrayBuffer(2);
        if (this._offset % 2 === 1)
            this._offset++;
        this._f64View[this._offset / 2] = arg;
        this._offset += 2;
    }
    float(arg) {
        this._ensureArrayBuffer(1);
        this._f32View[this._offset] = arg;
        this._offset++;
    }
    int32Array(args) {
        this._ensureArrayBuffer(args.length);
        for (let i = 0; i < args.length; ++i) {
            this._i32View[this._offset + i] = args[i];
        }
        this._offset += args.length;
    }
    float32Array(args) {
        this._ensureArrayBuffer(args.length);
        for (let i = 0; i < args.length; ++i) {
            this._f32View[this._offset + i] = args[i];
        }
        this._offset += args.length;
    }
    booleanArray(args) {
        this._ensureArrayBuffer(args.length);
        for (let i = 0; i < args.length; ++i) {
            this._i32View[this._offset + i] = args[i] ? 1 : 0;
        }
        this._offset += args.length;
    }
    uint8ArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.byteLength;
        this._offset++;
        this._u8View.set(data, this._offset * 4);
        // Update the int32 offset
        this._offset += (data.byteLength >> 2);
        if ((data.byteLength & 3) !== 0)
            this._offset++;
    }
    arrayBuffer(data) {
        let view = new Uint8Array(data);
        this.uint8ArrayBuffer(view);
    }
    uint8ClampedArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.byteLength;
        this._offset++;
        this._u8cView.set(data, this._offset * 4);
        // Update the int32 offset
        this._offset += (data.byteLength >> 2);
        if ((data.byteLength & 3) !== 0)
            this._offset++;
    }
    float32ArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.length;
        this._offset++;
        this._f32View.set(data, this._offset);
        this._offset += data.length;
    }
    uint16ArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.length;
        this._offset++;
        let u16Offset = this._offset * 2;
        this._u16View.set(data, u16Offset);
        // Update the int32 offset
        this._offset += (data.length >> 1);
        if ((data.length & 1) !== 0)
            this._offset++;
    }
    int32ArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.length;
        this._offset++;
        this._i32View.set(data, this._offset);
        this._offset += data.length;
    }
    uint32ArrayBuffer(data) {
        this._ensureArrayBuffer(data.byteLength / 4);
        this._i32View[this._offset] = data.length;
        this._offset++;
        this._u32View.set(data, this._offset);
        this._offset += data.length;
    }
    string(data) {
        let encoder = new TextEncoder();
        let res = encoder.encode(data);
        this._ensureArrayBuffer(res.byteLength / 4);
        this._i32View[this._offset] = res.byteLength;
        this._offset++;
        this._u8View.set(res, this._offset * 4);
        // Update the int32 offset
        this._offset += (res.byteLength >> 2);
        if ((res.byteLength & 3) !== 0)
            this._offset++;
    }
}
