import { zappar_camera_source_t, zappar_pipeline_t } from "./gen/zappar";
import { HTMLElementSource } from "./html-element-source";
export declare class CameraSource extends HTMLElementSource {
    private _impl;
    private _deviceId;
    static USER_DEFAULT_DEVICE_ID: string;
    static DEFAULT_DEVICE_ID: string;
    private _currentStream;
    private _activeDeviceId;
    private _explicitUserCameraId;
    private _explicitEnvironmentCameraId;
    constructor(_impl: zappar_camera_source_t, pipeline: zappar_pipeline_t, _deviceId: string);
    destroy(): void;
    private _stop;
    pause(): void;
    start(): void;
    private _getConstraints;
    getFrame(allowRead: boolean): void;
    private _getUserMedia;
    private _syncCamera;
    private _hasStartedOrientation;
    private _deviceMotionListener;
    private _deviceOrientationListener;
    private _startDeviceOrientation;
    private _startDeviceMotion;
    private _stopDeviceMotion;
}
