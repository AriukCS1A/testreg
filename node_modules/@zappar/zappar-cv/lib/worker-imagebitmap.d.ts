import { zappar_cwrap } from "./gen/zappar-native";
import { zappar_server } from "./gen/zappar-server";
import { MsgManager } from "./messages";
import { ImageBitmapC2S } from "./workerinterface";
export declare function handleImageBitmap(m: ImageBitmapC2S, r: zappar_cwrap, server: zappar_server, mgr: MsgManager): void;
