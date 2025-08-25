var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MsgManager } from "./messages";
export let messageManager = new MsgManager();
export function launchWorker(worker) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!worker)
            worker = new Worker(new URL("./worker", import.meta.url), { type: 'module' });
        worker.postMessage({
            t: "wasm",
            url: new URL("./zappar-cv.wasm", import.meta.url).toString()
        });
        yield waitForLoad(worker);
        function sendOutgoing() {
            let msgs = messageManager.getOutgoingMessages();
            for (let msg of msgs) {
                worker.postMessage(msg.msg, msg.transferables);
            }
        }
        messageManager.onOutgoingMessage.bind(sendOutgoing);
        sendOutgoing();
        worker.addEventListener("message", evt => {
            messageManager.postIncomingMessage(evt.data);
        });
    });
}
function waitForLoad(w) {
    return new Promise(resolve => {
        let listener = (msg) => {
            if (msg.data === "loaded") {
                w.removeEventListener("message", listener);
                resolve();
            }
        };
        w.addEventListener("message", listener);
    });
}
