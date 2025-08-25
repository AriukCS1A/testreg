export class Event {
    constructor() {
        this._funcs = [];
    }
    bind(f) {
        this._funcs.push(f);
    }
    unbind(f) {
        let indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    emit() {
        for (var i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i]();
        }
    }
}
export class Event1 {
    constructor() {
        this._funcs = [];
    }
    bind(f) {
        this._funcs.push(f);
    }
    unbind(f) {
        let indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    emit(a) {
        for (var i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i](a);
        }
    }
}
export class Event2 {
    constructor() {
        this._funcs = [];
    }
    bind(f) {
        this._funcs.push(f);
    }
    unbind(f) {
        let indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    emit(a, b) {
        for (var i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i](a, b);
        }
    }
}
export class Event3 {
    constructor() {
        this._funcs = [];
    }
    bind(f) {
        this._funcs.push(f);
    }
    unbind(f) {
        let indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    emit(a, b, c) {
        for (var i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i](a, b, c);
        }
    }
}
export class Event5 {
    constructor() {
        this._funcs = [];
    }
    bind(f) {
        this._funcs.push(f);
    }
    unbind(f) {
        let indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    emit(a, b, c, d, e) {
        for (var i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i](a, b, c, d, e);
        }
    }
}
