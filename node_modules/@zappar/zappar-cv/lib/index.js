import { initialize as nativeInitialize } from "./native";
import { VERSION } from "./version";
export function initialize(opts) {
    console.log(`Zappar CV v${VERSION}`);
    return nativeInitialize(opts);
}
export { barcode_format_t, face_landmark_name_t, instant_world_tracker_transform_orientation_t, log_level_t, image_target_type_t } from "./gen/zappar";
