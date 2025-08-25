import { vec3 } from "gl-matrix";
import { zcout } from "./loglevel";
let latestFaceMesh = 1;
let faceMeshById = new Map();
export function createFaceMesh() {
    let ret = (latestFaceMesh++);
    faceMeshById.set(ret, new FaceMesh());
    zcout("face_mesh_t initialized");
    return ret;
}
export function destroyFaceMesh(m) {
    faceMeshById.delete(m);
}
export function getFaceMesh(m) {
    return faceMeshById.get(m);
}
export class FaceMesh {
    constructor() {
        this.render_mean_ = new Float32Array();
        this.render_identity_ = new Float32Array(50);
        this.render_expression_ = new Float32Array(29);
        this.render_uvs_ = new Float32Array();
        this.render_indices_ = new Uint16Array();
        this.vertices_ = new Float32Array();
        this.normals_ = new Float32Array();
        this.normalsCalculated_ = false;
        this.modelVersion_ = -1;
        this.mirrored_ = false;
    }
    loadFromMemory(ab, fillMouth, fillEyeL, fillEyeR, fillNeck) {
        let offset = 0;
        let uint16View = new Uint16Array(ab);
        let intView = new Int32Array(ab);
        let floatView = new Float32Array(ab);
        let readMatrix = () => {
            let nr = intView[offset++];
            let nc = intView[offset++];
            let size = nr * nc;
            let ret = floatView.subarray(offset, offset + size);
            offset += size;
            return ret;
        };
        let readShortVector = () => {
            let size = intView[offset++];
            let ret = uint16View.subarray(offset * 2, offset * 2 + size);
            offset += size / 2;
            return ret;
        };
        this.render_mean_ = readMatrix();
        this.render_identity_ = readMatrix();
        this.render_expression_ = readMatrix();
        this.render_uvs_ = readMatrix();
        let baseIndices = readShortVector();
        let mouthIndices = (offset < intView.length) ? readShortVector() : new Uint16Array();
        let leftEyeIndices = (offset < intView.length) ? readShortVector() : new Uint16Array();
        let rightEyeIndices = (offset < intView.length) ? readShortVector() : new Uint16Array();
        let neckIndices = (offset < intView.length) ? readShortVector() : new Uint16Array();
        if (!fillMouth && !fillEyeL && !fillEyeR && !fillNeck) {
            this.render_indices_ = baseIndices;
        }
        else {
            let sizeRequired = baseIndices.length;
            if (fillMouth)
                sizeRequired += mouthIndices.length;
            if (fillEyeL)
                sizeRequired += leftEyeIndices.length;
            if (fillEyeR)
                sizeRequired += rightEyeIndices.length;
            if (fillNeck)
                sizeRequired += neckIndices.length;
            this.render_indices_ = new Uint16Array(sizeRequired);
            this.render_indices_.set(baseIndices, 0);
            let indx = baseIndices.length;
            if (fillMouth) {
                this.render_indices_.set(mouthIndices, indx);
                indx += mouthIndices.length;
            }
            if (fillEyeL) {
                this.render_indices_.set(leftEyeIndices, indx);
                indx += leftEyeIndices.length;
            }
            if (fillEyeR) {
                this.render_indices_.set(rightEyeIndices, indx);
                indx += rightEyeIndices.length;
            }
            if (fillNeck) {
                this.render_indices_.set(neckIndices, indx);
                indx += neckIndices.length;
            }
        }
        this.vertices_ = new Float32Array(this.render_mean_);
        this.normals_ = new Float32Array(this.vertices_.length);
        this.modelVersion_++;
    }
    getVertices() {
        return this.vertices_;
    }
    getUVs() {
        return this.render_uvs_;
    }
    getIndices() {
        if (this.mirrored_) {
            if (!this.render_indices_reversed) {
                this.render_indices_reversed = new Uint16Array(this.render_indices_.length);
                for (let i = 0; i < this.render_indices_.length; i += 3) {
                    this.render_indices_reversed[i] = this.render_indices_[i + 2];
                    this.render_indices_reversed[i + 1] = this.render_indices_[i + 1];
                    this.render_indices_reversed[i + 2] = this.render_indices_[i];
                }
            }
            return this.render_indices_reversed;
        }
        return this.render_indices_;
    }
    getNormals() {
        if (!this.normalsCalculated_)
            this.calculateNormals();
        return this.normals_;
    }
    getModelVersion() {
        return this.modelVersion_;
    }
    getLandmarkDataForVertex(v) {
        let mean = [
            this.render_mean_[v * 3],
            this.render_mean_[v * 3 + 1],
            this.render_mean_[v * 3 + 2],
        ];
        let identity = [];
        for (let i = 0; i < 50; i++) {
            identity.push(this.render_identity_[(v * 3) * 50 + i]),
                identity.push(this.render_identity_[(v * 3 + 1) * 50 + i]),
                identity.push(this.render_identity_[(v * 3 + 2) * 50 + i]);
        }
        let expression = [];
        for (let i = 0; i < 29; i++) {
            expression.push(this.render_expression_[(v * 3) * 29 + i]),
                expression.push(this.render_expression_[(v * 3 + 1) * 29 + i]),
                expression.push(this.render_expression_[(v * 3 + 2) * 29 + i]);
        }
        return { mean, identity, expression };
    }
    update(identity, expression, mirrored) {
        if (this.render_mean_.length === 0)
            return;
        if (this.render_identity_.length === 0)
            return;
        if (this.render_expression_.length === 0)
            return;
        this.mirrored_ = mirrored;
        this.vertices_.set(this.render_mean_);
        for (let i = 0; i < identity.length; i++) {
            for (let j = 0; j < this.vertices_.length; j++) {
                this.vertices_[j] += identity[i] * this.render_identity_[j * identity.length + i];
            }
        }
        for (let i = 0; i < expression.length; i++) {
            for (let j = 0; j < this.vertices_.length; j++) {
                this.vertices_[j] += expression[i] * this.render_expression_[j * expression.length + i];
            }
        }
        if (mirrored) {
            for (let j = 0; j < this.vertices_.length; j += 3) {
                this.vertices_[j] *= -1;
            }
        }
        this.normalsCalculated_ = false;
    }
    calculateNormals() {
        let indices = this.getIndices();
        let vertices = this.vertices_;
        let faceNormals = new Float32Array(indices.length);
        if (!vertices)
            return;
        let size = indices.length;
        let normals = this.normals_;
        let v = new Float32Array([0, 0, 0]);
        let w = new Float32Array([0, 0, 0]);
        let out = new Float32Array([0, 0, 0]);
        for (let i = 0; i < size; i += 3) {
            let vertexStart0 = indices[i] * 3;
            let vertexStart1 = indices[i + 1] * 3;
            let vertexStart2 = indices[i + 2] * 3;
            v[0] = vertices[vertexStart1] - vertices[vertexStart0];
            v[1] = vertices[vertexStart1 + 1] - vertices[vertexStart0 + 1];
            v[2] = vertices[vertexStart1 + 2] - vertices[vertexStart0 + 2];
            w[0] = vertices[vertexStart2] - vertices[vertexStart0];
            w[1] = vertices[vertexStart2 + 1] - vertices[vertexStart0 + 1];
            w[2] = vertices[vertexStart2 + 2] - vertices[vertexStart0 + 2];
            vec3.cross(out, v, w);
            let length = vec3.length(out);
            faceNormals[i] = out[0] / length;
            faceNormals[i + 1] = out[1] / length;
            faceNormals[i + 2] = out[2] / length;
        }
        normals.fill(0);
        for (let i = 0; i < size; i += 3) {
            let vertexStart0 = indices[i] * 3;
            let vertexStart1 = indices[i + 1] * 3;
            let vertexStart2 = indices[i + 2] * 3;
            normals[vertexStart0] += faceNormals[i];
            normals[vertexStart0 + 1] += faceNormals[i + 1];
            normals[vertexStart0 + 2] += faceNormals[i + 2];
            normals[vertexStart1] += faceNormals[i];
            normals[vertexStart1 + 1] += faceNormals[i + 1];
            normals[vertexStart1 + 2] += faceNormals[i + 2];
            normals[vertexStart2] += faceNormals[i];
            normals[vertexStart2 + 1] += faceNormals[i + 1];
            normals[vertexStart2 + 2] += faceNormals[i + 2];
        }
        let numberNormals = normals.length / 3;
        for (let i = 0; i < numberNormals; i++) {
            let indx = i * 3;
            v[0] = normals[indx];
            v[1] = normals[indx + 1];
            v[2] = normals[indx + 2];
            vec3.normalize(w, v);
            normals[indx] = w[0];
            normals[indx + 1] = w[1];
            normals[indx + 2] = w[2];
        }
        this.normalsCalculated_ = true;
    }
}
