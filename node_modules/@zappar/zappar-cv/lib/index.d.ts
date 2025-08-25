import { zappar } from "./gen/zappar";
import { Additional } from "./additional";
import { Options } from "./options";
export declare type Zappar = zappar & Additional;
export declare function initialize(opts?: Options): Zappar;
export { zappar_image_tracker_t, zappar_instant_world_tracker_t, zappar_barcode_finder_t, zappar_face_tracker_t, zappar_face_landmark_t, barcode_format_t, face_landmark_name_t, instant_world_tracker_transform_orientation_t, log_level_t, zappar_face_mesh_t, zappar_pipeline_t, zappar_camera_source_t, zappar_sequence_source_t, image_target_type_t } from "./gen/zappar";
