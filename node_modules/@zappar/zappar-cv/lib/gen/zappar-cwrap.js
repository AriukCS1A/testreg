export function getRuntimeObject(mod) {
    let log_level_wrapped = mod.cwrap("zappar_log_level", "number", []);
    let log_level_set_wrapped = mod.cwrap("zappar_log_level_set", null, [
        "number"
    ]);
    let analytics_project_id_set_wrapped = mod.cwrap("zappar_analytics_project_id_set", null, [
        "string", "string"
    ]);
    let pipeline_create_wrapped = mod.cwrap("zappar_pipeline_create", "number", []);
    let pipeline_destroy_wrapped = mod.cwrap("zappar_pipeline_destroy", null, ["number"]);
    let pipeline_frame_update_wrapped = mod.cwrap("zappar_pipeline_frame_update", null, [
        "number"
    ]);
    let pipeline_frame_number_wrapped = mod.cwrap("zappar_pipeline_frame_number", "number", [
        "number"
    ]);
    let pipeline_camera_model_wrapped = mod.cwrap("zappar_pipeline_camera_model", "number", [
        "number"
    ]);
    let pipeline_camera_frame_user_data_wrapped = mod.cwrap("zappar_pipeline_camera_frame_user_data", "number", [
        "number"
    ]);
    let pipeline_camera_frame_submit_wrapped = mod.cwrap("zappar_pipeline_camera_frame_submit", null, [
        "number",
        "number", "number", "number", "number", "number", "number", "number", "number"
    ]);
    let pipeline_camera_frame_submit_raw_pointer_wrapped = mod.cwrap("zappar_pipeline_camera_frame_submit_raw_pointer", null, [
        "number",
        "number", "number", "number", "number", "number", "number", "number", "number", "number", "number"
    ]);
    let pipeline_camera_frame_camera_attitude_wrapped = mod.cwrap("zappar_pipeline_camera_frame_camera_attitude", "number", [
        "number"
    ]);
    let pipeline_camera_frame_device_attitude_wrapped = mod.cwrap("zappar_pipeline_camera_frame_device_attitude", "number", [
        "number"
    ]);
    let pipeline_motion_accelerometer_submit_wrapped = mod.cwrap("zappar_pipeline_motion_accelerometer_submit", null, [
        "number",
        "number", "number", "number", "number"
    ]);
    let pipeline_motion_rotation_rate_submit_wrapped = mod.cwrap("zappar_pipeline_motion_rotation_rate_submit", null, [
        "number",
        "number", "number", "number", "number"
    ]);
    let pipeline_motion_attitude_submit_wrapped = mod.cwrap("zappar_pipeline_motion_attitude_submit", null, [
        "number",
        "number", "number", "number", "number"
    ]);
    let pipeline_motion_attitude_matrix_submit_wrapped = mod.cwrap("zappar_pipeline_motion_attitude_matrix_submit", null, [
        "number",
        "number"
    ]);
    let camera_source_create_wrapped = mod.cwrap("zappar_camera_source_create", "number", ["number", "string"]);
    let camera_source_destroy_wrapped = mod.cwrap("zappar_camera_source_destroy", null, ["number"]);
    let sequence_source_create_wrapped = mod.cwrap("zappar_sequence_source_create", "number", ["number"]);
    let sequence_source_destroy_wrapped = mod.cwrap("zappar_sequence_source_destroy", null, ["number"]);
    let image_tracker_create_wrapped = mod.cwrap("zappar_image_tracker_create", "number", ["number"]);
    let image_tracker_destroy_wrapped = mod.cwrap("zappar_image_tracker_destroy", null, ["number"]);
    let image_tracker_target_load_from_memory_wrapped = mod.cwrap("zappar_image_tracker_target_load_from_memory", null, [
        "number",
        "number", "number"
    ]);
    let image_tracker_target_loaded_version_wrapped = mod.cwrap("zappar_image_tracker_target_loaded_version", "number", [
        "number"
    ]);
    let image_tracker_enabled_wrapped = mod.cwrap("zappar_image_tracker_enabled", "number", [
        "number"
    ]);
    let image_tracker_enabled_set_wrapped = mod.cwrap("zappar_image_tracker_enabled_set", null, [
        "number",
        "number"
    ]);
    let image_tracker_anchor_count_wrapped = mod.cwrap("zappar_image_tracker_anchor_count", "number", [
        "number"
    ]);
    let image_tracker_anchor_id_wrapped = mod.cwrap("zappar_image_tracker_anchor_id", "string", [
        "number",
        "number"
    ]);
    let image_tracker_anchor_pose_raw_wrapped = mod.cwrap("zappar_image_tracker_anchor_pose_raw", "number", [
        "number",
        "number"
    ]);
    let face_tracker_create_wrapped = mod.cwrap("zappar_face_tracker_create", "number", ["number"]);
    let face_tracker_destroy_wrapped = mod.cwrap("zappar_face_tracker_destroy", null, ["number"]);
    let face_tracker_model_load_from_memory_wrapped = mod.cwrap("zappar_face_tracker_model_load_from_memory", null, [
        "number",
        "number", "number"
    ]);
    let face_tracker_model_loaded_version_wrapped = mod.cwrap("zappar_face_tracker_model_loaded_version", "number", [
        "number"
    ]);
    let face_tracker_enabled_set_wrapped = mod.cwrap("zappar_face_tracker_enabled_set", null, [
        "number",
        "number"
    ]);
    let face_tracker_enabled_wrapped = mod.cwrap("zappar_face_tracker_enabled", "number", [
        "number"
    ]);
    let face_tracker_max_faces_set_wrapped = mod.cwrap("zappar_face_tracker_max_faces_set", null, [
        "number",
        "number"
    ]);
    let face_tracker_max_faces_wrapped = mod.cwrap("zappar_face_tracker_max_faces", "number", [
        "number"
    ]);
    let face_tracker_anchor_count_wrapped = mod.cwrap("zappar_face_tracker_anchor_count", "number", [
        "number"
    ]);
    let face_tracker_anchor_id_wrapped = mod.cwrap("zappar_face_tracker_anchor_id", "string", [
        "number",
        "number"
    ]);
    let face_tracker_anchor_pose_raw_wrapped = mod.cwrap("zappar_face_tracker_anchor_pose_raw", "number", [
        "number",
        "number"
    ]);
    let face_tracker_anchor_identity_coefficients_wrapped = mod.cwrap("zappar_face_tracker_anchor_identity_coefficients", "number", [
        "number",
        "number"
    ]);
    let face_tracker_anchor_expression_coefficients_wrapped = mod.cwrap("zappar_face_tracker_anchor_expression_coefficients", "number", [
        "number",
        "number"
    ]);
    let face_mesh_create_wrapped = mod.cwrap("zappar_face_mesh_create", "number", []);
    let face_mesh_destroy_wrapped = mod.cwrap("zappar_face_mesh_destroy", null, ["number"]);
    let face_landmark_create_wrapped = mod.cwrap("zappar_face_landmark_create", "number", ["number"]);
    let face_landmark_destroy_wrapped = mod.cwrap("zappar_face_landmark_destroy", null, ["number"]);
    let barcode_finder_create_wrapped = mod.cwrap("zappar_barcode_finder_create", "number", ["number"]);
    let barcode_finder_destroy_wrapped = mod.cwrap("zappar_barcode_finder_destroy", null, ["number"]);
    let barcode_finder_enabled_set_wrapped = mod.cwrap("zappar_barcode_finder_enabled_set", null, [
        "number",
        "number"
    ]);
    let barcode_finder_enabled_wrapped = mod.cwrap("zappar_barcode_finder_enabled", "number", [
        "number"
    ]);
    let barcode_finder_found_number_wrapped = mod.cwrap("zappar_barcode_finder_found_number", "number", [
        "number"
    ]);
    let barcode_finder_found_text_wrapped = mod.cwrap("zappar_barcode_finder_found_text", "string", [
        "number",
        "number"
    ]);
    let barcode_finder_found_format_wrapped = mod.cwrap("zappar_barcode_finder_found_format", "number", [
        "number",
        "number"
    ]);
    let barcode_finder_formats_wrapped = mod.cwrap("zappar_barcode_finder_formats", "number", [
        "number"
    ]);
    let barcode_finder_formats_set_wrapped = mod.cwrap("zappar_barcode_finder_formats_set", null, [
        "number",
        "number"
    ]);
    let instant_world_tracker_create_wrapped = mod.cwrap("zappar_instant_world_tracker_create", "number", ["number"]);
    let instant_world_tracker_destroy_wrapped = mod.cwrap("zappar_instant_world_tracker_destroy", null, ["number"]);
    let instant_world_tracker_enabled_set_wrapped = mod.cwrap("zappar_instant_world_tracker_enabled_set", null, [
        "number",
        "number"
    ]);
    let instant_world_tracker_enabled_wrapped = mod.cwrap("zappar_instant_world_tracker_enabled", "number", [
        "number"
    ]);
    let instant_world_tracker_anchor_pose_raw_wrapped = mod.cwrap("zappar_instant_world_tracker_anchor_pose_raw", "number", [
        "number"
    ]);
    let instant_world_tracker_anchor_pose_set_from_camera_offset_raw_wrapped = mod.cwrap("zappar_instant_world_tracker_anchor_pose_set_from_camera_offset_raw", null, [
        "number",
        "number", "number", "number", "number"
    ]);
    let dataArrayArgLength = 32;
    let dataArrayArg = mod._malloc(dataArrayArgLength);
    let floatDataArrayArgLength = 16 * 4;
    let floatDataArrayArg = mod._malloc(floatDataArrayArgLength);
    let floatDataArraysByArgIndex = new Map();
    let getFloatDataArrayForArgIndex = (indx, len) => {
        let existing = floatDataArraysByArgIndex.get(indx);
        if (!existing || existing[0] < len) {
            if (existing)
                mod._free(existing[1]);
            existing = [len, mod._malloc(len)];
            floatDataArraysByArgIndex.set(indx, existing);
        }
        return existing[1];
    };
    return {
        log_level: () => {
            let ret = log_level_wrapped();
            return ret;
        },
        log_level_set: (level) => {
            let arg_level = level;
            let ret = log_level_set_wrapped(arg_level);
            return ret;
        },
        analytics_project_id_set: (id, uid) => {
            let arg_id = id;
            let arg_uid = uid;
            let ret = analytics_project_id_set_wrapped(arg_id, arg_uid);
            return ret;
        },
        pipeline_create: () => {
            return pipeline_create_wrapped();
        },
        pipeline_destroy: () => {
            pipeline_destroy_wrapped();
        },
        pipeline_frame_update: (o) => {
            let ret = pipeline_frame_update_wrapped(o);
            return ret;
        },
        pipeline_frame_number: (o) => {
            let ret = pipeline_frame_number_wrapped(o);
            return ret;
        },
        pipeline_camera_model: (o) => {
            let ret = pipeline_camera_model_wrapped(o);
            let ab = new Float32Array(6);
            ab.set(mod.HEAPF32.subarray(ret / 4, 6 + ret / 4));
            ret = ab;
            return ret;
        },
        pipeline_camera_frame_user_data: (o) => {
            let ret = pipeline_camera_frame_user_data_wrapped(o);
            return ret;
        },
        pipeline_camera_frame_submit: (o, data, width, height, user_data, camera_to_device_transform, camera_model, user_facing) => {
            if (dataArrayArgLength < data.byteLength) {
                mod._free(dataArrayArg);
                dataArrayArgLength = data.byteLength;
                dataArrayArg = mod._malloc(dataArrayArgLength);
            }
            let arg_data = dataArrayArg;
            let arg_len_data = data.byteLength;
            mod.HEAPU8.set(new Uint8Array(data), dataArrayArg);
            let arg_width = width;
            let arg_height = height;
            let arg_user_data = user_data;
            let arg_camera_to_device_transform = getFloatDataArrayForArgIndex(4, camera_to_device_transform.byteLength);
            mod.HEAPF32.set(camera_to_device_transform, arg_camera_to_device_transform / 4);
            let arg_camera_model = getFloatDataArrayForArgIndex(5, camera_model.byteLength);
            mod.HEAPF32.set(camera_model, arg_camera_model / 4);
            let arg_user_facing = user_facing ? 1 : 0;
            let ret = pipeline_camera_frame_submit_wrapped(o, arg_data, arg_len_data, arg_width, arg_height, arg_user_data, arg_camera_to_device_transform, arg_camera_model, arg_user_facing);
            return ret;
        },
        pipeline_camera_frame_submit_raw_pointer: (o, data, dataLength, format, width, height, user_data, camera_to_device_transform, rotation, camera_model, user_facing) => {
            let arg_data = data;
            let arg_dataLength = dataLength;
            let arg_format = format;
            let arg_width = width;
            let arg_height = height;
            let arg_user_data = user_data;
            let arg_camera_to_device_transform = getFloatDataArrayForArgIndex(6, camera_to_device_transform.byteLength);
            mod.HEAPF32.set(camera_to_device_transform, arg_camera_to_device_transform / 4);
            let arg_rotation = rotation;
            let arg_camera_model = getFloatDataArrayForArgIndex(8, camera_model.byteLength);
            mod.HEAPF32.set(camera_model, arg_camera_model / 4);
            let arg_user_facing = user_facing ? 1 : 0;
            let ret = pipeline_camera_frame_submit_raw_pointer_wrapped(o, arg_data, arg_dataLength, arg_format, arg_width, arg_height, arg_user_data, arg_camera_to_device_transform, arg_rotation, arg_camera_model, arg_user_facing);
            return ret;
        },
        pipeline_camera_frame_camera_attitude: (o) => {
            let ret = pipeline_camera_frame_camera_attitude_wrapped(o);
            let ab = new Float32Array(16);
            ab.set(mod.HEAPF32.subarray(ret / 4, 16 + ret / 4));
            ret = ab;
            return ret;
        },
        pipeline_camera_frame_device_attitude: (o) => {
            let ret = pipeline_camera_frame_device_attitude_wrapped(o);
            let ab = new Float32Array(16);
            ab.set(mod.HEAPF32.subarray(ret / 4, 16 + ret / 4));
            ret = ab;
            return ret;
        },
        pipeline_motion_accelerometer_submit: (o, time, x, y, z) => {
            let arg_time = time;
            let arg_x = x;
            let arg_y = y;
            let arg_z = z;
            let ret = pipeline_motion_accelerometer_submit_wrapped(o, arg_time, arg_x, arg_y, arg_z);
            return ret;
        },
        pipeline_motion_rotation_rate_submit: (o, time, x, y, z) => {
            let arg_time = time;
            let arg_x = x;
            let arg_y = y;
            let arg_z = z;
            let ret = pipeline_motion_rotation_rate_submit_wrapped(o, arg_time, arg_x, arg_y, arg_z);
            return ret;
        },
        pipeline_motion_attitude_submit: (o, time, x, y, z) => {
            let arg_time = time;
            let arg_x = x;
            let arg_y = y;
            let arg_z = z;
            let ret = pipeline_motion_attitude_submit_wrapped(o, arg_time, arg_x, arg_y, arg_z);
            return ret;
        },
        pipeline_motion_attitude_matrix_submit: (o, mat) => {
            let arg_mat = getFloatDataArrayForArgIndex(0, mat.byteLength);
            mod.HEAPF32.set(mat, arg_mat / 4);
            let ret = pipeline_motion_attitude_matrix_submit_wrapped(o, arg_mat);
            return ret;
        },
        camera_source_create: (pipeline, device_id) => {
            let arg_pipeline = pipeline;
            let arg_device_id = device_id;
            return camera_source_create_wrapped(arg_pipeline, arg_device_id);
        },
        camera_source_destroy: () => {
            camera_source_destroy_wrapped();
        },
        sequence_source_create: (pipeline) => {
            let arg_pipeline = pipeline;
            return sequence_source_create_wrapped(arg_pipeline);
        },
        sequence_source_destroy: () => {
            sequence_source_destroy_wrapped();
        },
        image_tracker_create: (pipeline) => {
            let arg_pipeline = pipeline;
            return image_tracker_create_wrapped(arg_pipeline);
        },
        image_tracker_destroy: () => {
            image_tracker_destroy_wrapped();
        },
        image_tracker_target_load_from_memory: (o, data) => {
            if (dataArrayArgLength < data.byteLength) {
                mod._free(dataArrayArg);
                dataArrayArgLength = data.byteLength;
                dataArrayArg = mod._malloc(dataArrayArgLength);
            }
            let arg_data = dataArrayArg;
            let arg_len_data = data.byteLength;
            mod.HEAPU8.set(new Uint8Array(data), dataArrayArg);
            let ret = image_tracker_target_load_from_memory_wrapped(o, arg_data, arg_len_data);
            return ret;
        },
        image_tracker_target_loaded_version: (o) => {
            let ret = image_tracker_target_loaded_version_wrapped(o);
            return ret;
        },
        image_tracker_enabled: (o) => {
            let ret = image_tracker_enabled_wrapped(o);
            ret = ret === 1;
            return ret;
        },
        image_tracker_enabled_set: (o, enabled) => {
            let arg_enabled = enabled ? 1 : 0;
            let ret = image_tracker_enabled_set_wrapped(o, arg_enabled);
            return ret;
        },
        image_tracker_anchor_count: (o) => {
            let ret = image_tracker_anchor_count_wrapped(o);
            return ret;
        },
        image_tracker_anchor_id: (o, indx) => {
            let arg_indx = indx;
            let ret = image_tracker_anchor_id_wrapped(o, arg_indx);
            return ret;
        },
        image_tracker_anchor_pose_raw: (o, indx) => {
            let arg_indx = indx;
            let ret = image_tracker_anchor_pose_raw_wrapped(o, arg_indx);
            let ab = new Float32Array(16);
            ab.set(mod.HEAPF32.subarray(ret / 4, 16 + ret / 4));
            ret = ab;
            return ret;
        },
        face_tracker_create: (pipeline) => {
            let arg_pipeline = pipeline;
            return face_tracker_create_wrapped(arg_pipeline);
        },
        face_tracker_destroy: () => {
            face_tracker_destroy_wrapped();
        },
        face_tracker_model_load_from_memory: (o, data) => {
            if (dataArrayArgLength < data.byteLength) {
                mod._free(dataArrayArg);
                dataArrayArgLength = data.byteLength;
                dataArrayArg = mod._malloc(dataArrayArgLength);
            }
            let arg_data = dataArrayArg;
            let arg_len_data = data.byteLength;
            mod.HEAPU8.set(new Uint8Array(data), dataArrayArg);
            let ret = face_tracker_model_load_from_memory_wrapped(o, arg_data, arg_len_data);
            return ret;
        },
        face_tracker_model_loaded_version: (o) => {
            let ret = face_tracker_model_loaded_version_wrapped(o);
            return ret;
        },
        face_tracker_enabled_set: (o, enabled) => {
            let arg_enabled = enabled ? 1 : 0;
            let ret = face_tracker_enabled_set_wrapped(o, arg_enabled);
            return ret;
        },
        face_tracker_enabled: (o) => {
            let ret = face_tracker_enabled_wrapped(o);
            ret = ret === 1;
            return ret;
        },
        face_tracker_max_faces_set: (o, num) => {
            let arg_num = num;
            let ret = face_tracker_max_faces_set_wrapped(o, arg_num);
            return ret;
        },
        face_tracker_max_faces: (o) => {
            let ret = face_tracker_max_faces_wrapped(o);
            return ret;
        },
        face_tracker_anchor_count: (o) => {
            let ret = face_tracker_anchor_count_wrapped(o);
            return ret;
        },
        face_tracker_anchor_id: (o, indx) => {
            let arg_indx = indx;
            let ret = face_tracker_anchor_id_wrapped(o, arg_indx);
            return ret;
        },
        face_tracker_anchor_pose_raw: (o, indx) => {
            let arg_indx = indx;
            let ret = face_tracker_anchor_pose_raw_wrapped(o, arg_indx);
            let ab = new Float32Array(16);
            ab.set(mod.HEAPF32.subarray(ret / 4, 16 + ret / 4));
            ret = ab;
            return ret;
        },
        face_tracker_anchor_identity_coefficients: (o, indx) => {
            let arg_indx = indx;
            let ret = face_tracker_anchor_identity_coefficients_wrapped(o, arg_indx);
            let ab = new Float32Array(50);
            ab.set(mod.HEAPF32.subarray(ret / 4, 50 + ret / 4));
            ret = ab;
            return ret;
        },
        face_tracker_anchor_expression_coefficients: (o, indx) => {
            let arg_indx = indx;
            let ret = face_tracker_anchor_expression_coefficients_wrapped(o, arg_indx);
            let ab = new Float32Array(29);
            ab.set(mod.HEAPF32.subarray(ret / 4, 29 + ret / 4));
            ret = ab;
            return ret;
        },
        face_mesh_create: () => {
            return face_mesh_create_wrapped();
        },
        face_mesh_destroy: () => {
            face_mesh_destroy_wrapped();
        },
        face_landmark_create: (landmark) => {
            let arg_landmark = landmark;
            return face_landmark_create_wrapped(arg_landmark);
        },
        face_landmark_destroy: () => {
            face_landmark_destroy_wrapped();
        },
        barcode_finder_create: (pipeline) => {
            let arg_pipeline = pipeline;
            return barcode_finder_create_wrapped(arg_pipeline);
        },
        barcode_finder_destroy: () => {
            barcode_finder_destroy_wrapped();
        },
        barcode_finder_enabled_set: (o, enabled) => {
            let arg_enabled = enabled ? 1 : 0;
            let ret = barcode_finder_enabled_set_wrapped(o, arg_enabled);
            return ret;
        },
        barcode_finder_enabled: (o) => {
            let ret = barcode_finder_enabled_wrapped(o);
            ret = ret === 1;
            return ret;
        },
        barcode_finder_found_number: (o) => {
            let ret = barcode_finder_found_number_wrapped(o);
            return ret;
        },
        barcode_finder_found_text: (o, indx) => {
            let arg_indx = indx;
            let ret = barcode_finder_found_text_wrapped(o, arg_indx);
            return ret;
        },
        barcode_finder_found_format: (o, indx) => {
            let arg_indx = indx;
            let ret = barcode_finder_found_format_wrapped(o, arg_indx);
            return ret;
        },
        barcode_finder_formats: (o) => {
            let ret = barcode_finder_formats_wrapped(o);
            return ret;
        },
        barcode_finder_formats_set: (o, f) => {
            let arg_f = f;
            let ret = barcode_finder_formats_set_wrapped(o, arg_f);
            return ret;
        },
        instant_world_tracker_create: (pipeline) => {
            let arg_pipeline = pipeline;
            return instant_world_tracker_create_wrapped(arg_pipeline);
        },
        instant_world_tracker_destroy: () => {
            instant_world_tracker_destroy_wrapped();
        },
        instant_world_tracker_enabled_set: (o, enabled) => {
            let arg_enabled = enabled ? 1 : 0;
            let ret = instant_world_tracker_enabled_set_wrapped(o, arg_enabled);
            return ret;
        },
        instant_world_tracker_enabled: (o) => {
            let ret = instant_world_tracker_enabled_wrapped(o);
            ret = ret === 1;
            return ret;
        },
        instant_world_tracker_anchor_pose_raw: (o) => {
            let ret = instant_world_tracker_anchor_pose_raw_wrapped(o);
            let ab = new Float32Array(16);
            ab.set(mod.HEAPF32.subarray(ret / 4, 16 + ret / 4));
            ret = ab;
            return ret;
        },
        instant_world_tracker_anchor_pose_set_from_camera_offset_raw: (o, x, y, z, orientation) => {
            let arg_x = x;
            let arg_y = y;
            let arg_z = z;
            let arg_orientation = orientation;
            let ret = instant_world_tracker_anchor_pose_set_from_camera_offset_raw_wrapped(o, arg_x, arg_y, arg_z, arg_orientation);
            return ret;
        },
    };
}
