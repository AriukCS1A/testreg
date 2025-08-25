import { zappar_face_mesh_t, zappar_face_tracker_t, zappar_pipeline_t, zappar_image_tracker_t, zappar_sequence_source_t } from "./gen/zappar";
export declare type zappar_html_element_source_t = number & {
    _: 'zappar_html_element_source_t';
};
export interface Additional {
    pipeline_gl_context_set(pipeline: zappar_pipeline_t, gl: WebGLRenderingContext, texturePool?: WebGLTexture[]): void;
    pipeline_gl_context_lost(pipeline: zappar_pipeline_t): void;
    pipeline_draw_face(pipeline: zappar_pipeline_t, projectionMatrix: Float32Array, cameraMatrix: Float32Array, targetMatrix: Float32Array, o: zappar_face_mesh_t): void;
    pipeline_draw_image_target_preview(pipeline: zappar_pipeline_t, projectionMatrix: Float32Array, cameraMatrix: Float32Array, targetMatrix: Float32Array, o: zappar_image_tracker_t, indx: number): void;
    pipeline_draw_face_project(pipeline: zappar_pipeline_t, drawwMatrix: Float32Array, vertices: Float32Array, uvMatrix: Float32Array, uvs: Float32Array, indices: Uint16Array, texture: WebGLTexture): void;
    draw_plane(gl: WebGLRenderingContext, projectionMatrix: Float32Array, cameraMatrix: Float32Array, targetMatrix: Float32Array, texture: string): void;
    image_tracker_target_image(o: zappar_image_tracker_t, indx: number): HTMLImageElement | undefined;
    face_mesh_load_default(o: zappar_face_mesh_t): Promise<void>;
    face_mesh_load_default_face(o: zappar_face_mesh_t, fillMouth: boolean, fillEyeL: boolean, fillEyeR: boolean): Promise<void>;
    face_mesh_load_default_full_head_simplified(o: zappar_face_mesh_t, fillMouth: boolean, fillEyeL: boolean, fillEyeR: boolean, fillNeck: boolean): Promise<void>;
    face_tracker_model_load_default(o: zappar_face_tracker_t): Promise<void>;
    pipeline_camera_frame_draw_gl(pipeline: zappar_pipeline_t, screenWidth: number, screenHeight: number, mirror?: boolean): void;
    permission_request_ui_promise(): Promise<boolean>;
    html_element_source_create(pipeline: zappar_pipeline_t, element: HTMLVideoElement | HTMLImageElement): zappar_html_element_source_t;
    html_element_source_start(o: zappar_html_element_source_t): void;
    html_element_source_pause(o: zappar_html_element_source_t): void;
    html_element_source_destroy(o: zappar_html_element_source_t): void;
    browser_incompatible: () => boolean;
    browser_incompatible_ui: () => void;
    sequence_source_time_set: (o: zappar_sequence_source_t, ms: number) => void;
    cookies_permitted: (p: boolean) => void;
}
