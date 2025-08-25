export declare class Event {
    private _funcs;
    bind(f: () => void): void;
    unbind(f: () => void): void;
    emit(): void;
}
export declare class Event1<A> {
    private _funcs;
    bind(f: (a: A) => void): void;
    unbind(f: (a: A) => void): void;
    emit(a: A): void;
}
export declare class Event2<A, B> {
    private _funcs;
    bind(f: (a: A, b: B) => void): void;
    unbind(f: (a: A, b: B) => void): void;
    emit(a: A, b: B): void;
}
export declare class Event3<A, B, C> {
    private _funcs;
    bind(f: (a: A, b: B, c: C) => void): void;
    unbind(f: (a: A, b: B, c: C) => void): void;
    emit(a: A, b: B, c: C): void;
}
export declare class Event5<A, B, C, D, E> {
    private _funcs;
    bind(f: (a: A, b: B, c: C, d: D, e: E) => void): void;
    unbind(f: (a: A, b: B, c: C, d: D, e: E) => void): void;
    emit(a: A, b: B, c: C, d: D, e: E): void;
}
