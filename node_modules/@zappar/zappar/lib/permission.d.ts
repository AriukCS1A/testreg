/**
 * The permissions that may be requested.
*/
export declare enum Permission {
    /**
    * Permission to access camera images.
    */
    CAMERA = 0,
    /**
     * Permission to access device motion data (e.g. accelerometer and gyro). Some tracking algorithms require this data to operate.
     */
    MOTION = 1
}
/**
 * Checks if the browser has currently granted relevant permissions.
 * @param onlyPermsission - The exclusive permission to query, otherwise all are queried.
 * @returns The permission granted state. 'true' if permission is granted.
*/
export declare function permissionGranted(onlyPermsission?: Permission): boolean;
/**
 * Checks if the browser has currently denied relevant permissions.
 * @param onlyPermsission - The exclusive permission to query, otherwise all are queried.
 * @returns The permission granted state. 'true' if permission is denied.
*/
export declare function permissionDenied(onlyPermission?: Permission): boolean;
/**
 * Requests the browser to grant relevant permissions.
 *
 * This may or may not trigger a browser-provided user dialog prompting a permission choice.
 *
 * @param onlyPermission - The exclusive permission to query, otherwise all are requested.
 * @returns A Promise containing granted status. 'true' if granted.
*/
export declare function permissionRequest(onlyPermission?: Permission): Promise<boolean>;
/**
 * Shows Zappar's built-in UI to request camera and motion data permissions
 * @returns A promise containing granted status.
*/
export declare function permissionRequestUI(): Promise<boolean>;
/**
 * Shows Zappar's built-in permission denied UI.
*/
export declare function permissionDeniedUI(): void;
