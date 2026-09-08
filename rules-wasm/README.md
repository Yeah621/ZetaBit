# rules-wasm

Chess rules for the chess-app: `shakmaty` wrapped in `GameCore` (plain
Rust, no wasm-bindgen) plus a thin WASM-facing wrapper (`Game`) around
it. `GameCore` is what makes this crate genuinely reusable - the
frontend uses `Game` compiled to WASM for instant client-side legal-move
preview; the backend depends on this crate directly as a normal Rust
library and uses `GameCore` for authoritative server-side move
validation (Play with Friend). Same rules, two consumers, one
implementation.

Also compiles as a plain `rlib` (see `[lib] crate-type` in Cargo.toml),
which is what lets the Axum backend depend on this crate directly
instead of wrapping shakmaty a second time.

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
