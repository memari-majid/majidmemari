/**
 * The model mirrors the punctuation it is shown, and the data files that feed
 * the system prompt contain em and en dashes. Every rendered system prompt
 * passes through this so the reply style rule ("no em dashes") is backed by
 * the prompt itself, not just asserted in it.
 *
 * Client-safe: pure string functions.
 */

const EM_DASHES = /\s*[—―⸺⸻]\s*/g;
const EN_DASH_BETWEEN_WORDS = /(\S)\s*[–‒]\s*(\S)/g;
const EN_DASH_LOOSE = /\s*[–‒]\s*/g;

export function plainPunctuation(text: string): string {
  let out = text
    // "word — word" reads as a clause break: use a comma.
    .replace(EM_DASHES, ", ")
    // "2015–2022", "33236–33282", "Academia–Industry": a plain hyphen.
    .replace(EN_DASH_BETWEEN_WORDS, "$1-$2")
    .replace(EN_DASH_LOOSE, ", ");
  // Clean the seams the replacements can leave behind.
  out = out
    .replace(/\(\s*,\s+/g, "(")
    .replace(/,\s*,/g, ",")
    .replace(/:\s*,\s+/g, ": ")
    .replace(/^,\s+/gm, "")
    .replace(/,\s+\)/g, ")")
    .replace(/,\s+([.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
  return out;
}

/** True when the text still contains a dash the copy rules forbid. */
export function hasLongDash(text: string): boolean {
  return /[‒–—―⸺⸻]/.test(text);
}
