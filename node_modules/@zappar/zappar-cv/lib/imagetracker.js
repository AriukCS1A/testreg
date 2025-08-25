import { image_target_type_t } from "./gen/zappar-native";
import { getPreviewMesh } from "./imagetracker-previewmesh";
import { RiffReader } from "./riff-reader";
let byId = new Map();
const decoder = new TextDecoder();
export class ImageTracker {
    constructor(_client, _impl) {
        this._client = _client;
        this._impl = _impl;
        this._targets = [];
    }
    static create(pipeline, client) {
        let ret = client.image_tracker_create(pipeline);
        byId.set(ret, new ImageTracker(client, ret));
        return ret;
    }
    static get(p) {
        return byId.get(p);
    }
    destroy() {
        this._client.image_tracker_destroy(this._impl);
        byId.delete(this._impl);
    }
    loadFromMemory(data) {
        this._targets.push({ data });
        this._client.image_tracker_target_load_from_memory(this._impl, data);
    }
    targetCount() {
        return this._targets.length;
    }
    getTargetInfo(i) {
        let current = this._targets[i];
        if (current && current.info)
            return current.info;
        current.info = {
            topRadius: -1,
            bottomRadius: -1,
            sideLength: -1,
            physicalScaleFactor: -1,
            trainedWidth: 0,
            trainedHeight: 0,
            type: image_target_type_t.IMAGE_TRACKER_TYPE_PLANAR
        };
        try {
            const reader = new RiffReader(current.data, false);
            const imgChunk = reader.find("IMG ");
            if (imgChunk) {
                let mimeType = "image/png";
                const mimeTypeChunk = reader.find("IMGM");
                if (mimeTypeChunk)
                    mimeType = decoder.decode(mimeTypeChunk.data);
                current.info.preview = { mimeType, compressed: imgChunk.data };
            }
            const odleChunk = reader.find("ODLE");
            if (odleChunk) {
                const odle = decoder.decode(odleChunk.data);
                this._parseOdle(odle, current.info);
            }
        }
        catch (err) { }
        return current.info;
    }
    _parseOdle(data, info) {
        let currentOffset = 0;
        let version = "0";
        [version, currentOffset] = readLine(currentOffset, data);
        if (version === "1")
            return this._parseOdleV1(data, currentOffset, info);
        else if (version === "3")
            return this._parseOdleV3(data, currentOffset, info);
    }
    _parseOdleV1(data, currentOffset, info) {
        let treeOrFlat = "0";
        [treeOrFlat, currentOffset] = readLine(currentOffset, data);
        if (treeOrFlat !== "0" && treeOrFlat !== "1")
            return;
        let emptyLine = "";
        [emptyLine, currentOffset] = readLine(currentOffset, data);
        if (emptyLine.length !== 0)
            return;
        let infoLine = "";
        [infoLine, currentOffset] = readLine(currentOffset, data);
        const infoLineParts = infoLine.split(" ");
        if (infoLineParts.length < 5)
            return;
        info.trainedWidth = parseInt(infoLineParts[3].replace("[", ""));
        info.trainedHeight = parseInt(infoLineParts[4].replace("]", ""));
    }
    _parseOdleV3(data, currentOffset, info) {
        let treeOrFlat = "0";
        [treeOrFlat, currentOffset] = readLine(currentOffset, data);
        if (treeOrFlat !== "0" && treeOrFlat !== "1")
            return;
        let numberTargets = "0";
        [numberTargets, currentOffset] = readLine(currentOffset, data);
        const parsedTargets = parseInt(numberTargets);
        if (isNaN(parsedTargets) || parsedTargets < 1)
            return;
        let emptyLine = "";
        [emptyLine, currentOffset] = readLine(currentOffset, data);
        if (emptyLine.length !== 0)
            return;
        let infoLine = "";
        [infoLine, currentOffset] = readLine(currentOffset, data);
        const infoLineParts = infoLine.split(" ");
        if (infoLineParts.length < 6)
            return;
        const targetType = parseInt(infoLineParts[0]);
        if (targetType === 0 || targetType === 1 || targetType === 2)
            info.type = targetType;
        info.trainedWidth = parseInt(infoLineParts[4].replace("[", ""));
        info.trainedHeight = parseInt(infoLineParts[5].replace("]", ""));
        if (infoLineParts.length >= 7) {
            info.physicalScaleFactor = parseFloat(infoLineParts[6]);
            if (isNaN(info.physicalScaleFactor))
                info.physicalScaleFactor = -1;
        }
        if (infoLineParts.length >= 8) {
            info.topRadius = parseFloat(infoLineParts[7]);
            if (isNaN(info.topRadius))
                info.topRadius = -1;
            info.bottomRadius = info.topRadius;
        }
        if (infoLineParts.length >= 9) {
            info.bottomRadius = parseFloat(infoLineParts[8]);
            if (isNaN(info.bottomRadius))
                info.bottomRadius = -1;
        }
        if (infoLineParts.length >= 10) {
            info.sideLength = parseFloat(infoLineParts[9]);
            if (isNaN(info.sideLength))
                info.sideLength = -1;
        }
    }
    getDecodedPreview(i) {
        const info = this.getTargetInfo(i);
        if (!info.preview)
            return undefined;
        if (!info.preview.image) {
            const blob = new Blob([info.preview.compressed], { type: info.preview.mimeType });
            info.preview.image = new Image();
            info.preview.image.src = URL.createObjectURL(blob);
        }
        return info.preview.image;
    }
    getPreviewMesh(i) {
        const info = this.getTargetInfo(i);
        if (!info.previewMesh)
            info.previewMesh = getPreviewMesh(info);
        return info.previewMesh;
    }
}
function readLine(offset, str) {
    let indx = str.indexOf("\n", offset);
    return [str.substring(offset, indx >= 0 ? indx : undefined).replace("\r", ""), indx + 1];
}
