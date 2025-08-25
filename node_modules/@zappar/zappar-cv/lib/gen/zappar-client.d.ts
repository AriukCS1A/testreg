import { MessageSerializer } from "../serializer";
import { MessageDeserializer } from "../deserializer";
import { zappar_cwrap } from "./zappar-native";
export declare class zappar_client {
    private _messageSender;
    constructor(_messageSender: (ab: ArrayBuffer) => void);
    private _globalState;
    serializer: MessageSerializer;
    deserializer: MessageDeserializer;
    private _latestId;
    private _pipeline_state_by_instance;
    private _camera_source_state_by_instance;
    private _sequence_source_state_by_instance;
    private _image_tracker_state_by_instance;
    private _face_tracker_state_by_instance;
    private _face_mesh_state_by_instance;
    private _face_landmark_state_by_instance;
    private _barcode_finder_state_by_instance;
    private _instant_world_tracker_state_by_instance;
    impl: zappar_cwrap;
    processMessages(a: ArrayBuffer): void;
}
