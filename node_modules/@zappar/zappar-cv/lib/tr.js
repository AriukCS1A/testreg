export var STRINGS;
(function (STRINGS) {
    STRINGS[STRINGS["PermissionTitle"] = 0] = "PermissionTitle";
    STRINGS[STRINGS["PermissionDescription"] = 1] = "PermissionDescription";
    STRINGS[STRINGS["PermissionButton"] = 2] = "PermissionButton";
})(STRINGS || (STRINGS = {}));
function parseLanguage(inp) {
    const [lang, locale] = inp.toLowerCase().split("-");
    return [lang, locale || ""];
}
const [lang, locale] = parseLanguage(navigator.language);
export function tr(str) {
    switch (lang) {
        case "es":
            switch (str) {
                case STRINGS.PermissionTitle: return "Ya casi...";
                case STRINGS.PermissionDescription: return "Para brindar esta experiencia de realidad aumentada, necesitamos acceso a la cámara y los sensores de movimiento de su dispositivo.";
                case STRINGS.PermissionButton: return "Permitir acceso";
            }
            break;
        case "de":
            switch (str) {
                case STRINGS.PermissionTitle: return "Fast am Ziel..";
                case STRINGS.PermissionDescription: return "Um dir dieses Augmented Reality Erlebnis zu liefern, brauchen wir Zugriff auf die Kamera und Bewegungssensoren deines Gerätes.";
                case STRINGS.PermissionButton: return "Gewähre Zugriff";
            }
            break;
        case "pt":
            switch (str) {
                case STRINGS.PermissionTitle: return "Está quase!";
                case STRINGS.PermissionDescription: return "Esta experiência de realidade aumentada precisa de acesso à câmera e aos sensores de movimento deste dispositivo.";
                case STRINGS.PermissionButton: return "Permitir acesso";
            }
            break;
    }
    switch (str) {
        case STRINGS.PermissionTitle: return "Almost there...";
        case STRINGS.PermissionDescription: return "In order to provide this augmented reality experience, we need access to your device's camera and motion sensors.";
        case STRINGS.PermissionButton: return "Grant Access";
    }
    return "";
}
