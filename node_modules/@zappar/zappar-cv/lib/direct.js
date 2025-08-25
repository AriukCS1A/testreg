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
import { launchWorkerServer } from "./worker-server";
import { messageManager as workerMessageManager } from "./worker-server";
export let messageManager = new MsgManager();
export function launchWorker(wasm) {
    return __awaiter(this, void 0, void 0, function* () {
        messageManager.onOutgoingMessage.bind(() => {
            let msgs = messageManager.getOutgoingMessages();
            for (let msg of msgs)
                workerMessageManager.postIncomingMessage(msg.msg);
        });
        workerMessageManager.onOutgoingMessage.bind(() => {
            let msgs = workerMessageManager.getOutgoingMessages();
            for (let msg of msgs)
                messageManager.postIncomingMessage(msg.msg);
        });
        launchWorkerServer(wasm);
    });
}
