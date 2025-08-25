/**
 * A type-safe event handling class that multiple functions to be registered to be called when events are emitted.
 */
export class Event {
    constructor() {
        this._funcs = [];
    }
    /**
     * Bind new handler function.
     * @param f - The callback function to be bound.
     */
    bind(f) {
        this._funcs.push(f);
    }
    /**
     * Unbind an existing handler function.
     * @param f - The callback function to be unbound.
     */
    unbind(f) {
        const indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    /**
     * Emit an event, calling the bound handler functions.
     */
    emit() {
        for (let i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i]();
        }
    }
}
/**
 * A type-safe event handling class that multiple functions to be registered to be called when events are emitted.
 * This class will pass a single argument supplied to [[emit]] to the handler functions.
 *
 * @typeparam A - The type of the argument passed to the handler functions through [[emit]].
 */
export class Event1 {
    constructor() {
        this._funcs = [];
    }
    /**
     * Bind new handler function.
     * @param f - The callback function to be bound.
    */
    bind(f) {
        this._funcs.push(f);
    }
    /**
     * Unbind an existing function.
     * @param f - The callback function to be unbound.
     */
    unbind(f) {
        const indx = this._funcs.indexOf(f);
        if (indx > -1) {
            this._funcs.splice(indx, 1);
        }
    }
    /**
     * Emit an event.
     *
     * @param a - The argument to pass to handler functions.
     */
    emit(a) {
        for (let i = 0, total = this._funcs.length; i < total; i++) {
            this._funcs[i](a);
        }
    }
}
