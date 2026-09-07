/* tslint:disable */
/* eslint-disable */

export class Game {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Attempts to play `orig` -> `dest`. `promotion` is one of
     * "q" / "r" / "b" / "n"; omit it to auto-queen on a promoting move
     * (no promotion picker yet - roadmap Phase 6). Throws if illegal.
     */
    applyMove(orig: string, dest: string, promotion?: string | null): any;
    /**
     * Loads a position from a FEN string.
     */
    static fromFen(fen_str: string): Game;
    /**
     * New game, standard starting position.
     */
    constructor();
    /**
     * Current position: FEN, whose turn, the `movable.dests` map, and
     * game-over flags. Call once after construction to get the initial
     * board state (`applyMove` already returns the post-move snapshot,
     * so you don't need to call this again after a move).
     */
    state(): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_game_free: (a: number, b: number) => void;
    readonly game_applyMove: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly game_fromFen: (a: number, b: number) => [number, number, number];
    readonly game_new: () => number;
    readonly game_state: (a: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
