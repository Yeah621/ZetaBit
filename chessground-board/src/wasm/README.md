# rules-wasm

Chess rules for the chess-app frontend: `shakmaty` (the same rules crate
the eventual Axum backend will use) compiled to WASM. Gives Chessground's
`movable.dests` real legal moves instead of `movable.free: true`.

Also compiles as a plain `rlib`, so Phase 3's Axum backend can depend on
this crate directly instead of wrapping shakmaty a second time.

## Build

One-time setup:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

Build (run from the repo root, i.e. the parent of `rules-wasm/` and
`chessground-board/`):

```bash
wasm-pack build rules-wasm --target web --out-dir ../chessground-board/src/wasm
```

This writes `chessground-board/src/wasm/rules_wasm.js` (+ `.d.ts`) and
`rules_wasm_bg.wasm`. `useChessGame.ts` imports from there - re-run this
command after any change to `src/lib.rs`.

`--target web` was picked over `--target bundler` specifically so Vite
needs no extra plugin (`vite-plugin-wasm` etc.): the generated glue just
`fetch()`es the `.wasm` file itself, which Vite already serves as a
static asset with zero config.

The generated output is checked into git for now, same as any other
build product this small - switch to gitignoring it plus a build step in
CI once that's set up.
