import { launchWorkerServer, messageManager } from "./worker-server";
const ctx = self;
messageManager.onOutgoingMessage.bind(() => {
    let msgs = messageManager.getOutgoingMessages();
    for (let msg of msgs) {
        ctx.postMessage(msg.msg, msg.transferables);
    }
});
let launchHandler = (evt) => {
    if (evt && evt.data && evt.data.t === "wasm") {
        let url = location.href.startsWith("blob") ? evt.data.url : new URL("./zappar-cv.wasm", import.meta.url).toString();
        launchWorkerServer(url);
        ctx.removeEventListener("message", launchHandler);
    }
};
ctx.addEventListener("message", launchHandler);
ctx.addEventListener("message", evt => {
    messageManager.postIncomingMessage(evt.data);
});
