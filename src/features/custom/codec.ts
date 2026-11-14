import type { CardType } from "../../content/types";
import {
  MAX_CARDS,
  findCardTextProblem,
  findTitleProblem,
  isCardType,
  type CardContent,
} from "./deckRules";

/**
 * Share links carry the whole deck in the URL hash, so the deck never reaches a server:
 * `/custom/import#d=<base64url of UTF-8 JSON>`, where the JSON is
 * `{ v: 1, title, cards: [{ t: <card type>, x: <card text> }] }`.
 */
export const SHARE_PAYLOAD_VERSION = 1;
export const IMPORT_PATH = "/custom/import";
/** Links past this length can get cut by messaging apps, so sharing warns first. */
export const LONG_LINK_WARNING_LENGTH = 8000;
/** Realistic decks, even 200 long cards, fit under this; anything longer is refused before decoding. */
export const MAX_PAYLOAD_LENGTH = 400_000;
const PAYLOAD_PARAMETER = "d";

export interface SharedDeck {
  title: string;
  cards: CardContent[];
}

interface SharedDeckPayload {
  v: typeof SHARE_PAYLOAD_VERSION;
  title: string;
  cards: { t: CardType; x: string }[];
}

export type DecodeErrorReason =
  "missing" | "corrupt" | "too-large" | "invalid-deck";
/** Why a link was refused as too large: the raw payload length, or the number of cards. */
export type TooLargeDetail = "payload" | "card-count";
/** Which part of a well-formed payload broke the deck rules. */
export type InvalidDeckDetail =
  | "version"
  | "title-empty"
  | "title-too-long"
  | "no-cards"
  | "card-type"
  | "card-empty"
  | "card-too-long";

export type DecodeResult =
  | { isDecoded: true; deck: SharedDeck }
  | { isDecoded: false; reason: "missing" | "corrupt" }
  | { isDecoded: false; reason: "too-large"; detail: TooLargeDetail }
  | {
      isDecoded: false;
      reason: "invalid-deck";
      detail: InvalidDeckDetail;
      cardNumber?: number;
    };

const BYTE_CHUNK_SIZE = 0x8000;

/** Unicode-safe base64url: UTF-8 bytes through btoa, URL-safe alphabet, no padding. */
export const encodeTextToBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binaryText = "";
  for (let offset = 0; offset < bytes.length; offset += BYTE_CHUNK_SIZE) {
    binaryText += String.fromCharCode(
      ...bytes.subarray(offset, offset + BYTE_CHUNK_SIZE)
    );
  }
  return btoa(binaryText)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/** Undefined when the text is not base64url or the bytes are not valid UTF-8. */
export const decodeBase64UrlToText = (payload: string): string | undefined => {
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || payload.length % 4 === 1)
    return undefined;
  const paddedLength = Math.ceil(payload.length / 4) * 4;
  const base64 = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(paddedLength, "=");
  let binaryText: string;
  try {
    binaryText = atob(base64);
  } catch {
    return undefined;
  }
  const bytes = Uint8Array.from(binaryText, (character) =>
    character.charCodeAt(0)
  );
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
};

export const encodeSharedDeck = (deck: SharedDeck): string => {
  const payload: SharedDeckPayload = {
    v: SHARE_PAYLOAD_VERSION,
    title: deck.title,
    cards: deck.cards.map((card) => ({ t: card.type, x: card.text })),
  };
  return encodeTextToBase64Url(JSON.stringify(payload));
};

export const buildShareUrl = (deck: SharedDeck, origin: string): string =>
  `${origin}${IMPORT_PATH}#${PAYLOAD_PARAMETER}=${encodeSharedDeck(deck)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validatePayload = (parsed: unknown): DecodeResult => {
  if (!isRecord(parsed)) return { isDecoded: false, reason: "corrupt" };
  if (parsed.v !== SHARE_PAYLOAD_VERSION) {
    // A higher number comes from a newer Unravel; any other value is damage.
    const isNewerVersion =
      typeof parsed.v === "number" && parsed.v > SHARE_PAYLOAD_VERSION;
    return isNewerVersion
      ? { isDecoded: false, reason: "invalid-deck", detail: "version" }
      : { isDecoded: false, reason: "corrupt" };
  }
  const titleProblem =
    typeof parsed.title === "string" ? findTitleProblem(parsed.title) : "empty";
  if (titleProblem || typeof parsed.title !== "string") {
    return {
      isDecoded: false,
      reason: "invalid-deck",
      detail: titleProblem === "too-long" ? "title-too-long" : "title-empty",
    };
  }
  if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    return { isDecoded: false, reason: "invalid-deck", detail: "no-cards" };
  }
  if (parsed.cards.length > MAX_CARDS) {
    return { isDecoded: false, reason: "too-large", detail: "card-count" };
  }

  const cards: CardContent[] = [];
  for (const [cardIndex, rawCard] of parsed.cards.entries()) {
    const cardNumber = cardIndex + 1;
    const rawText: unknown = isRecord(rawCard) ? rawCard.x : undefined;
    const rawType: unknown = isRecord(rawCard) ? rawCard.t : undefined;
    const textProblem =
      typeof rawText === "string" ? findCardTextProblem(rawText) : "empty";
    if (textProblem || typeof rawText !== "string") {
      const detail =
        textProblem === "too-long" ? "card-too-long" : "card-empty";
      return { isDecoded: false, reason: "invalid-deck", detail, cardNumber };
    }
    if (!isCardType(rawType)) {
      return {
        isDecoded: false,
        reason: "invalid-deck",
        detail: "card-type",
        cardNumber,
      };
    }
    cards.push({ type: rawType, text: rawText.trim() });
  }
  return { isDecoded: true, deck: { title: parsed.title.trim(), cards } };
};

/** Reads the deck from a location hash such as `#d=eyJ2Ijox...`. */
export const decodeDeckFromHash = (hash: string): DecodeResult => {
  const payload = new URLSearchParams(hash.replace(/^#/, "")).get(
    PAYLOAD_PARAMETER
  );
  if (!payload) return { isDecoded: false, reason: "missing" };
  if (payload.length > MAX_PAYLOAD_LENGTH) {
    return { isDecoded: false, reason: "too-large", detail: "payload" };
  }
  const jsonText = decodeBase64UrlToText(payload);
  if (jsonText === undefined) return { isDecoded: false, reason: "corrupt" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { isDecoded: false, reason: "corrupt" };
  }
  return validatePayload(parsed);
};
