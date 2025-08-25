import { log_level_t as LogLevel } from "@zappar/zappar-cv";
export { log_level_t as LogLevel } from "@zappar/zappar-cv";
/**
 * @returns The granularity of logging emitted by the library.
*/
export declare function logLevel(): LogLevel;
/**
 * Sets the granularity of logging emitted by the library.
*/
export declare function setLogLevel(l: LogLevel): void;
