/**
 * A type-safe event handling class that multiple functions to be registered to be called when events are emitted.
 */
export declare class Event {
    private _funcs;
    /**
     * Bind new handler function.
     * @param f - The callback function to be bound.
     */
    bind(f: () => void): void;
    /**
     * Unbind an existing handler function.
     * @param f - The callback function to be unbound.
     */
    unbind(f: () => void): void;
    /**
     * Emit an event, calling the bound handler functions.
     */
    emit(): void;
}
/**
 * A type-safe event handling class that multiple functions to be registered to be called when events are emitted.
 * This class will pass a single argument supplied to [[emit]] to the handler functions.
 *
 * @typeparam A - The type of the argument passed to the handler functions through [[emit]].
 */
export declare class Event1<A> {
    private _funcs;
    /**
     * Bind new handler function.
     * @param f - The callback function to be bound.
    */
    bind(f: (a: A) => void): void;
    /**
     * Unbind an existing function.
     * @param f - The callback function to be unbound.
     */
    unbind(f: (a: A) => void): void;
    /**
     * Emit an event.
     *
     * @param a - The argument to pass to handler functions.
     */
    emit(a: A): void;
}
