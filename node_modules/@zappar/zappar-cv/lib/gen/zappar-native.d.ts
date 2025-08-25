export declare enum barcode_format_t {
    UNKNOWN = 131072,
    AZTEC = 1,
    CODABAR = 2,
    CODE_39 = 4,
    CODE_93 = 8,
    CODE_128 = 16,
    DATA_MATRIX = 32,
    EAN_8 = 64,
    EAN_13 = 128,
    ITF = 256,
    MAXICODE = 512,
    PDF_417 = 1024,
    QR_CODE = 2048,
    RSS_14 = 4096,
    RSS_EXPANDED = 8192,
    UPC_A = 16384,
    UPC_E = 32768,
    UPC_EAN_EXTENSION = 65536,
    ALL = 131071
}
export declare enum face_landmark_name_t {
    EYE_LEFT = 0,
    EYE_RIGHT = 1,
    EAR_LEFT = 2,
    EAR_RIGHT = 3,
    NOSE_BRIDGE = 4,
    NOSE_TIP = 5,
    NOSE_BASE = 6,
    LIP_TOP = 7,
    LIP_BOTTOM = 8,
    MOUTH_CENTER = 9,
    CHIN = 10,
    EYEBROW_LEFT = 11,
    EYEBROW_RIGHT = 12
}
export declare enum instant_world_tracker_transform_orientation_t {
    WORLD = 3,
    MINUS_Z_AWAY_FROM_USER = 4,
    MINUS_Z_HEADING = 5,
    UNCHANGED = 6
}
export declare enum log_level_t {
    LOG_LEVEL_NONE = 0,
    LOG_LEVEL_ERROR = 1,
    LOG_LEVEL_WARNING = 2,
    LOG_LEVEL_VERBOSE = 3
}
export declare enum frame_pixel_format_t {
    FRAME_PIXEL_FORMAT_I420 = 0,
    FRAME_PIXEL_FORMAT_I420A = 1,
    FRAME_PIXEL_FORMAT_I422 = 2,
    FRAME_PIXEL_FORMAT_I444 = 3,
    FRAME_PIXEL_FORMAT_NV12 = 4,
    FRAME_PIXEL_FORMAT_RGBA = 5,
    FRAME_PIXEL_FORMAT_BGRA = 6,
    FRAME_PIXEL_FORMAT_Y = 7
}
export declare enum image_target_type_t {
    IMAGE_TRACKER_TYPE_PLANAR = 0,
    IMAGE_TRACKER_TYPE_CYLINDRICAL = 1,
    IMAGE_TRACKER_TYPE_CONICAL = 2
}
export declare type zappar_pipeline_t = number & {
    _: 'zappar_pipeline_t';
};
export declare type zappar_camera_source_t = number & {
    _: 'zappar_camera_source_t';
};
export declare type zappar_sequence_source_t = number & {
    _: 'zappar_sequence_source_t';
};
export declare type zappar_image_tracker_t = number & {
    _: 'zappar_image_tracker_t';
};
export declare type zappar_face_tracker_t = number & {
    _: 'zappar_face_tracker_t';
};
export declare type zappar_face_mesh_t = number & {
    _: 'zappar_face_mesh_t';
};
export declare type zappar_face_landmark_t = number & {
    _: 'zappar_face_landmark_t';
};
export declare type zappar_barcode_finder_t = number & {
    _: 'zappar_barcode_finder_t';
};
export declare type zappar_instant_world_tracker_t = number & {
    _: 'zappar_instant_world_tracker_t';
};
export interface zappar_cwrap {
    log_level(): log_level_t;
    log_level_set(level: log_level_t): void;
    analytics_project_id_set(id: string, uid: string): void;
    pipeline_create(): zappar_pipeline_t;
    pipeline_destroy(o: zappar_pipeline_t): void;
    pipeline_frame_update(o: zappar_pipeline_t): void;
    pipeline_frame_number(o: zappar_pipeline_t): number;
    pipeline_camera_model(o: zappar_pipeline_t): Float32Array;
    pipeline_camera_frame_user_data(o: zappar_pipeline_t): number;
    pipeline_camera_frame_submit(o: zappar_pipeline_t, data: ArrayBuffer, width: number, height: number, user_data: number, camera_to_device_transform: Float32Array, camera_model: Float32Array, user_facing: boolean): void;
    pipeline_camera_frame_submit_raw_pointer(o: zappar_pipeline_t, data: number, dataLength: number, format: frame_pixel_format_t, width: number, height: number, user_data: number, camera_to_device_transform: Float32Array, rotation: number, camera_model: Float32Array, user_facing: boolean): void;
    pipeline_camera_frame_camera_attitude(o: zappar_pipeline_t): Float32Array;
    pipeline_camera_frame_device_attitude(o: zappar_pipeline_t): Float32Array;
    pipeline_motion_accelerometer_submit(o: zappar_pipeline_t, time: number, x: number, y: number, z: number): void;
    pipeline_motion_rotation_rate_submit(o: zappar_pipeline_t, time: number, x: number, y: number, z: number): void;
    pipeline_motion_attitude_submit(o: zappar_pipeline_t, time: number, x: number, y: number, z: number): void;
    pipeline_motion_attitude_matrix_submit(o: zappar_pipeline_t, mat: Float32Array): void;
    camera_source_create(pipeline: zappar_pipeline_t, device_id: string): zappar_camera_source_t;
    camera_source_destroy(o: zappar_camera_source_t): void;
    sequence_source_create(pipeline: zappar_pipeline_t): zappar_sequence_source_t;
    sequence_source_destroy(o: zappar_sequence_source_t): void;
    image_tracker_create(pipeline: zappar_pipeline_t): zappar_image_tracker_t;
    image_tracker_destroy(o: zappar_image_tracker_t): void;
    image_tracker_target_load_from_memory(o: zappar_image_tracker_t, data: ArrayBuffer): void;
    image_tracker_target_loaded_version(o: zappar_image_tracker_t): number;
    image_tracker_enabled(o: zappar_image_tracker_t): boolean;
    image_tracker_enabled_set(o: zappar_image_tracker_t, enabled: boolean): void;
    image_tracker_anchor_count(o: zappar_image_tracker_t): number;
    image_tracker_anchor_id(o: zappar_image_tracker_t, indx: number): string;
    image_tracker_anchor_pose_raw(o: zappar_image_tracker_t, indx: number): Float32Array;
    face_tracker_create(pipeline: zappar_pipeline_t): zappar_face_tracker_t;
    face_tracker_destroy(o: zappar_face_tracker_t): void;
    face_tracker_model_load_from_memory(o: zappar_face_tracker_t, data: ArrayBuffer): void;
    face_tracker_model_loaded_version(o: zappar_face_tracker_t): number;
    face_tracker_enabled_set(o: zappar_face_tracker_t, enabled: boolean): void;
    face_tracker_enabled(o: zappar_face_tracker_t): boolean;
    face_tracker_max_faces_set(o: zappar_face_tracker_t, num: number): void;
    face_tracker_max_faces(o: zappar_face_tracker_t): number;
    face_tracker_anchor_count(o: zappar_face_tracker_t): number;
    face_tracker_anchor_id(o: zappar_face_tracker_t, indx: number): string;
    face_tracker_anchor_pose_raw(o: zappar_face_tracker_t, indx: number): Float32Array;
    face_tracker_anchor_identity_coefficients(o: zappar_face_tracker_t, indx: number): Float32Array;
    face_tracker_anchor_expression_coefficients(o: zappar_face_tracker_t, indx: number): Float32Array;
    face_mesh_create(): zappar_face_mesh_t;
    face_mesh_destroy(o: zappar_face_mesh_t): void;
    face_landmark_create(landmark: face_landmark_name_t): zappar_face_landmark_t;
    face_landmark_destroy(o: zappar_face_landmark_t): void;
    barcode_finder_create(pipeline: zappar_pipeline_t): zappar_barcode_finder_t;
    barcode_finder_destroy(o: zappar_barcode_finder_t): void;
    barcode_finder_enabled_set(o: zappar_barcode_finder_t, enabled: boolean): void;
    barcode_finder_enabled(o: zappar_barcode_finder_t): boolean;
    barcode_finder_found_number(o: zappar_barcode_finder_t): number;
    barcode_finder_found_text(o: zappar_barcode_finder_t, indx: number): string;
    barcode_finder_found_format(o: zappar_barcode_finder_t, indx: number): barcode_format_t;
    barcode_finder_formats(o: zappar_barcode_finder_t): barcode_format_t;
    barcode_finder_formats_set(o: zappar_barcode_finder_t, f: barcode_format_t): void;
    instant_world_tracker_create(pipeline: zappar_pipeline_t): zappar_instant_world_tracker_t;
    instant_world_tracker_destroy(o: zappar_instant_world_tracker_t): void;
    instant_world_tracker_enabled_set(o: zappar_instant_world_tracker_t, enabled: boolean): void;
    instant_world_tracker_enabled(o: zappar_instant_world_tracker_t): boolean;
    instant_world_tracker_anchor_pose_raw(o: zappar_instant_world_tracker_t): Float32Array;
    instant_world_tracker_anchor_pose_set_from_camera_offset_raw(o: zappar_instant_world_tracker_t, x: number, y: number, z: number, orientation: instant_world_tracker_transform_orientation_t): void;
}
