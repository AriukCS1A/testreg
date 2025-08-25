var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FaceMesh } from "./facemesh";
import { face_landmark_name_t } from "./gen/zappar";
let vertexIndexByName = new Map([
    [face_landmark_name_t.EAR_LEFT, 888],
    [face_landmark_name_t.EAR_RIGHT, 467],
    [face_landmark_name_t.EYE_LEFT, [1076, 1062]],
    [face_landmark_name_t.EYE_RIGHT, [1094, 1108]],
    [face_landmark_name_t.NOSE_BRIDGE, 36],
    [face_landmark_name_t.NOSE_BASE, 3],
    [face_landmark_name_t.NOSE_TIP, 8],
    [face_landmark_name_t.LIP_TOP, 24],
    [face_landmark_name_t.LIP_BOTTOM, 25],
    [face_landmark_name_t.MOUTH_CENTER, [24, 25]],
    [face_landmark_name_t.CHIN, 1049],
    [face_landmark_name_t.EYEBROW_LEFT, 657],
    [face_landmark_name_t.EYEBROW_RIGHT, 210],
]);
export function generateDataJSON() {
    return __awaiter(this, void 0, void 0, function* () {
        let mesh = new FaceMesh();
        let url = new URL("./face_mesh_face_model.zbin", import.meta.url);
        let req = yield fetch(url.toString());
        mesh.loadFromMemory(yield req.arrayBuffer(), false, false, false, false);
        let names = new Set([face_landmark_name_t.EYE_LEFT, face_landmark_name_t.EYE_RIGHT, face_landmark_name_t.EAR_LEFT, face_landmark_name_t.EAR_RIGHT, face_landmark_name_t.NOSE_BRIDGE, face_landmark_name_t.NOSE_TIP, face_landmark_name_t.NOSE_BASE, face_landmark_name_t.LIP_TOP, face_landmark_name_t.LIP_BOTTOM, face_landmark_name_t.MOUTH_CENTER, face_landmark_name_t.CHIN, face_landmark_name_t.EYEBROW_LEFT, face_landmark_name_t.EYEBROW_RIGHT]);
        let data = {};
        for (let n of names) {
            let indices = vertexIndexByName.get(n);
            if (!indices)
                throw new Error("NO VERTEX FOR " + n.toString());
            if (Array.isArray(indices)) {
                let arr = [];
                for (let i of indices) {
                    arr.push(mesh.getLandmarkDataForVertex(i));
                }
                data[n] = arr;
            }
            else {
                data[n] = mesh.getLandmarkDataForVertex(indices);
            }
        }
        return JSON.stringify(data, (key, val) => {
            return val.toFixed ? Number(val.toFixed(4)) : val;
        });
    });
}
function arrayAsCPPLiteral(a) {
    return `{ ${a.join(", ")} }`;
}
export function generateDataCPP() {
    return __awaiter(this, void 0, void 0, function* () {
        let mesh = new FaceMesh();
        let url = new URL("./face_mesh_face_model.zbin", import.meta.url);
        let req = yield fetch(url.toString());
        mesh.loadFromMemory(yield req.arrayBuffer(), false, false, false, false);
        let names = [face_landmark_name_t.EYE_LEFT, face_landmark_name_t.EYE_RIGHT, face_landmark_name_t.EAR_LEFT, face_landmark_name_t.EAR_RIGHT, face_landmark_name_t.NOSE_BRIDGE, face_landmark_name_t.NOSE_TIP, face_landmark_name_t.NOSE_BASE, face_landmark_name_t.LIP_TOP, face_landmark_name_t.LIP_BOTTOM, face_landmark_name_t.MOUTH_CENTER, face_landmark_name_t.CHIN, face_landmark_name_t.EYEBROW_LEFT, face_landmark_name_t.EYEBROW_RIGHT];
        let output = "std::vector<std::vector<std::vector<float> > > _zappar_landmark_means = {\n";
        output += names.map(val => {
            let indices = vertexIndexByName.get(val);
            if (!indices)
                throw new Error("NO VERTEX FOR " + val.toString());
            if (!Array.isArray(indices))
                indices = [indices];
            return arrayAsCPPLiteral(indices.map(val => arrayAsCPPLiteral(mesh.getLandmarkDataForVertex(val).mean)));
        }).join(",\n");
        output += "};\n";
        output += "std::vector<std::vector<std::vector<float> > > _zappar_landmark_identities = {\n";
        output += names.map(val => {
            let indices = vertexIndexByName.get(val);
            if (!indices)
                throw new Error("NO VERTEX FOR " + val.toString());
            if (!Array.isArray(indices))
                indices = [indices];
            return arrayAsCPPLiteral(indices.map(val => arrayAsCPPLiteral(mesh.getLandmarkDataForVertex(val).identity)));
        }).join(",\n");
        output += "};\n";
        output += "std::vector<std::vector<std::vector<float> > > _zappar_landmark_expressions = {\n";
        output += names.map(val => {
            let indices = vertexIndexByName.get(val);
            if (!indices)
                throw new Error("NO VERTEX FOR " + val.toString());
            if (!Array.isArray(indices))
                indices = [indices];
            return arrayAsCPPLiteral(indices.map(val => arrayAsCPPLiteral(mesh.getLandmarkDataForVertex(val).expression)));
        }).join(",\n");
        output += "};\n";
        return output;
    });
}
