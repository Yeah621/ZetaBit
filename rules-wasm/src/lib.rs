//! WASM bindings around `shakmaty` for client-side chess rules.
//!
//! Phase 1 of the chess-app roadmap: gives Chessground's `movable.dests` a
//! real legal-move source (instead of `movable.free: true`), validates
//! moves, and reports check/checkmate/stalemate/insufficient-material.
//!
//! Runs entirely in the browser (no backend round-trip), which is what
//! Local Pass & Play needs anyway since both players share one device.
//! Once the Axum backend exists (Phase 3+), it stays authoritative for
//! Play with Friend / Play with AI - this module is only ever a fast
//! client-side preview layer, never the source of truth for a networked
//! game. This crate also builds as a plain rlib, so the backend can
//! depend on it directly later instead of re-wrapping shakmaty again.
//!
//! No promotion picker exists yet (see roadmap Phase 6), so `apply_move`
//! auto-queens whenever `promotion` is omitted on a promoting move.

use std::collections::HashMap;

use serde::Serialize;
use shakmaty::{fen::Fen, CastlingMode, Chess, Color, EnPassantMode, Position, Role, Square};
use wasm_bindgen::prelude::*;

/// Snapshot handed back to JS after construction and after every move.
/// `dests` is an array of `[origin, [destinations]]` pairs rather than a
/// plain map - trivially becomes a real `Map` on the JS side via
/// `new Map(snapshot.dests)`, and sidesteps any ambiguity in how a Rust
/// `HashMap` gets serialized.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StateSnapshot {
    fen: String,
    turn: &'static str,
    check: bool,
    game_over: bool,
    checkmate: bool,
    stalemate: bool,
    insufficient_material: bool,
    dests: Vec<(String, Vec<String>)>,
    last_move: Option<(String, String)>,
}

#[wasm_bindgen]
pub struct Game {
    pos: Chess,
}

#[wasm_bindgen]
impl Game {
    /// New game, standard starting position.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        Game {
            pos: Chess::default(),
        }
    }

    /// Loads a position from a FEN string.
    #[wasm_bindgen(js_name = fromFen)]
    pub fn from_fen(fen_str: &str) -> Result<Game, JsError> {
        let fen: Fen = fen_str
            .parse()
            .map_err(|e| JsError::new(&format!("invalid FEN: {e:?}")))?;
        let pos: Chess = fen
            .into_position(CastlingMode::Standard)
            .map_err(|e| JsError::new(&format!("illegal position: {e:?}")))?;
        Ok(Game { pos })
    }

    /// Current position: FEN, whose turn, the `movable.dests` map, and
    /// game-over flags. Call once after construction to get the initial
    /// board state (`applyMove` already returns the post-move snapshot,
    /// so you don't need to call this again after a move).
    pub fn state(&self) -> Result<JsValue, JsError> {
        to_js(&self.snapshot(None))
    }

    /// Attempts to play `orig` -> `dest`. `promotion` is one of
    /// "q" / "r" / "b" / "n"; omit it to auto-queen on a promoting move
    /// (no promotion picker yet - roadmap Phase 6). Throws if illegal.
    #[wasm_bindgen(js_name = applyMove)]
    pub fn apply_move(
        &mut self,
        orig: &str,
        dest: &str,
        promotion: Option<String>,
    ) -> Result<JsValue, JsError> {
        let from: Square = orig
            .parse()
            .map_err(|_| JsError::new("invalid origin square"))?;
        let to: Square = dest
            .parse()
            .map_err(|_| JsError::new("invalid destination square"))?;
        let wanted = promotion.as_deref().and_then(role_from_letter);

        let mv = self
            .pos
            .legal_moves()
            .into_iter()
            .find(|m| {
                m.from() == Some(from)
                    && m.to() == to
                    && match m.promotion() {
                        Some(role) => Some(role) == wanted.or(Some(Role::Queen)),
                        None => wanted.is_none(),
                    }
            })
            .ok_or_else(|| JsError::new("illegal move"))?;

        self.pos = self
            .pos
            .clone()
            .play(mv)
            .map_err(|e| JsError::new(&format!("illegal move: {e:?}")))?;

        to_js(&self.snapshot(Some((orig.to_string(), dest.to_string()))))
    }

    fn snapshot(&self, last_move: Option<(String, String)>) -> StateSnapshot {
        let mut grouped: HashMap<Square, Vec<Square>> = HashMap::new();
        for m in self.pos.legal_moves() {
            if let Some(from) = m.from() {
                grouped.entry(from).or_default().push(m.to());
            }
        }
        let dests = grouped
            .into_iter()
            .map(|(from, tos)| {
                (
                    from.to_string(),
                    tos.into_iter().map(|t| t.to_string()).collect(),
                )
            })
            .collect();

        StateSnapshot {
            fen: Fen::from_position(&self.pos, EnPassantMode::Legal).to_string(),
            turn: match self.pos.turn() {
                Color::White => "white",
                Color::Black => "black",
            },
            check: self.pos.is_check(),
            game_over: self.pos.is_game_over(),
            checkmate: self.pos.is_checkmate(),
            stalemate: self.pos.is_stalemate(),
            insufficient_material: self.pos.is_insufficient_material(),
            dests,
            last_move,
        }
    }
}

fn role_from_letter(s: &str) -> Option<Role> {
    match s {
        "q" | "Q" => Some(Role::Queen),
        "r" | "R" => Some(Role::Rook),
        "b" | "B" => Some(Role::Bishop),
        "n" | "N" => Some(Role::Knight),
        _ => None,
    }
}

fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsError> {
    serde_wasm_bindgen::to_value(value).map_err(|e| JsError::new(&e.to_string()))
          }
  
