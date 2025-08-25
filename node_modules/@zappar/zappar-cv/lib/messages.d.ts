import { Event, Event1 } from "./event";
export interface Msg {
    msg: any;
    transferables: any[];
}
export declare class MsgManager {
    onOutgoingMessage: Event;
    onIncomingMessage: Event1<any>;
    private _outgoingMessages;
    postIncomingMessage(msg: any): void;
    postOutgoingMessage(msg: any, trans: any[]): void;
    getOutgoingMessages(): Msg[];
}
