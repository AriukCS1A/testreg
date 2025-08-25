import { log_level_t } from "./gen/zappar";
let logLevel = log_level_t.LOG_LEVEL_ERROR;
export function setLogLevel(l) {
    logLevel = l;
}
export function zcout(...args) {
    if (logLevel >= log_level_t.LOG_LEVEL_VERBOSE)
        console.log("[Zappar] INFO", ...args);
}
export function zcerr(...args) {
    if (logLevel >= log_level_t.LOG_LEVEL_ERROR)
        console.error("[Zappar] ERROR", ...args);
}
export function zcwarn(...args) {
    if (logLevel >= log_level_t.LOG_LEVEL_VERBOSE)
        console.log("[Zappar] WARN", ...args);
}
