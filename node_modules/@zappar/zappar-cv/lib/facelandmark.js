import { mat4 } from "gl-matrix";
import { landmarkData } from "./facelandmarkdata";
import { zcout } from "./loglevel";
let latestFaceLandmark = 1;
let faceLandmarkById = new Map();
export function createFaceLandmark(n) {
    let ret = (latestFaceLandmark++);
    faceLandmarkById.set(ret, new FaceLandmark(n));
    zcout("face_landmark_t initialized");
    return ret;
}
export function destroyFaceLandmark(m) {
    faceLandmarkById.delete(m);
}
export function getFaceLandmark(m) {
    return faceLandmarkById.get(m);
}
export class FaceLandmark {
    constructor(_name) {
        this._name = _name;
        this.anchor_pose = mat4.create();
    }
    _getVertex(identity, expression, data) {
        let vert = data.mean.slice();
        for (let i = 0; i < 50; i++) {
            vert[0] += identity[i] * data.identity[i * 3 + 0];
            vert[1] += identity[i] * data.identity[i * 3 + 1];
            vert[2] += identity[i] * data.identity[i * 3 + 2];
        }
        for (let i = 0; i < 29; i++) {
            vert[0] += expression[i] * data.expression[i * 3 + 0];
            vert[1] += expression[i] * data.expression[i * 3 + 1];
            vert[2] += expression[i] * data.expression[i * 3 + 2];
        }
        return vert;
    }
    update(identity, expression, mirrored) {
        let vert;
        let data = landmarkData[this._name.toString()];
        if (!data)
            return;
        if (Array.isArray(data)) {
            vert = this._getVertex(identity, expression, data[0]);
            let b = this._getVertex(identity, expression, data[1]);
            vert[0] = 0.5 * (vert[0] + b[0]);
            vert[1] = 0.5 * (vert[1] + b[1]);
            vert[2] = 0.5 * (vert[2] + b[2]);
        }
        else {
            vert = this._getVertex(identity, expression, data);
        }
        if (mirrored)
            vert[0] *= -1;
        mat4.fromTranslation(this.anchor_pose, vert);
    }
}
