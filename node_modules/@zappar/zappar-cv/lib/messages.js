import { Event, Event1 } from "./event";
export class MsgManager {
    constructor() {
        this.onOutgoingMessage = new Event();
        this.onIncomingMessage = new Event1();
        this._outgoingMessages = [];
    }
    postIncomingMessage(msg) {
        this.onIncomingMessage.emit(msg);
    }
    postOutgoingMessage(msg, trans) {
        this._outgoingMessages.push({
            msg: msg,
            transferables: trans
        });
        this.onOutgoingMessage.emit();
    }
    getOutgoingMessages() {
        let ret = this._outgoingMessages;
        this._outgoingMessages = [];
        return ret;
    }
}
