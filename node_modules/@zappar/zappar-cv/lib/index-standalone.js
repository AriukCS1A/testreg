import { initialize as init } from "./index";
export * from "./index";
export function initialize(opts) {
    return init(Object.assign(Object.assign({}, opts), { worker: (opts === null || opts === void 0 ? void 0 : opts.worker) || new (require("worker-loader?inline=fallback!./worker").default)() }));
}
