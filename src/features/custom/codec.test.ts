import { describe, expect, it } from "vitest";
import {
  IMPORT_PATH,
  MAX_PAYLOAD_LENGTH,
  buildShareUrl,
  decodeBase64UrlToText,
  decodeDeckFromHash,
  encodeSharedDeck,
  encodeTextToBase64Url,
  type SharedDeck,
} from "./codec";
import { CARD_TEXT_MAX_LENGTH, MAX_CARDS, TITLE_MAX_LENGTH } from "./deckRules";

const sampleDeck: SharedDeck = {
  title: "Noite de sexta",
  cards: [
    { type: "question", text: "Qual é a tua memória mais feliz do verão?" },
    {
      type: "challenge",
      text: "Imita o teu animal favorito durante 10 segundos",
    },
    {
      type: "everyone",
      text: "Everyone shares a song that makes them smile 🎶",
    },
  ],
};

const hashFor = (value: unknown): string =>
  `#d=${encodeTextToBase64Url(JSON.stringify(value))}`;

const payloadFor = (deck: SharedDeck) => ({
  v: 1,
  title: deck.title,
  cards: deck.cards.map((card) => ({ t: card.type, x: card.text })),
});

describe("share link codec", () => {
  it("round-trips a deck with accents and emoji", () => {
    const result = decodeDeckFromHash(`#d=${encodeSharedDeck(sampleDeck)}`);
    expect(result).toEqual({ isDecoded: true, deck: sampleDeck });
  });

  it("round-trips vote and hot-seat cards", () => {
    const groupDeck: SharedDeck = {
      title: "Group night",
      cards: [
        {
          type: "vote",
          text: "Who is most likely to forget their own birthday?",
        },
        {
          type: "hot-seat",
          text: "Everyone asks the person in the hot seat about their first job",
        },
      ],
    };
    expect(decodeDeckFromHash(`#d=${encodeSharedDeck(groupDeck)}`)).toEqual({
      isDecoded: true,
      deck: groupDeck,
    });
  });

  it("still decodes a link made before the new types", () => {
    const oldLinkHash =
      "#d=eyJ2IjoxLCJ0aXRsZSI6Ik9sZCBsaW5rIiwiY2FyZHMiOlt7InQiOiJxdWVzdGlvbiIsIngiOiJCZXN0IHRyaXA_In0seyJ0IjoiY2hhbGxlbmdlIiwieCI6Ikh1bSBhIHNvbmcifSx7InQiOiJldmVyeW9uZSIsIngiOiJFdmVyeW9uZSBuYW1lcyBhIHNuYWNrIn1dfQ";
    expect(decodeDeckFromHash(oldLinkHash)).toEqual({
      isDecoded: true,
      deck: {
        title: "Old link",
        cards: [
          { type: "question", text: "Best trip?" },
          { type: "challenge", text: "Hum a song" },
          { type: "everyone", text: "Everyone names a snack" },
        ],
      },
    });
  });

  it("builds an import URL that carries the deck in the hash", () => {
    const url = buildShareUrl(sampleDeck, "https://unravel.example");
    expect(url.startsWith(`https://unravel.example${IMPORT_PATH}#d=`)).toBe(
      true
    );
    expect(decodeDeckFromHash(new URL(url).hash)).toEqual({
      isDecoded: true,
      deck: sampleDeck,
    });
  });

  it("uses only URL-safe characters without padding", () => {
    const payload = encodeSharedDeck(sampleDeck);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("round-trips text through base64url for every padding length", () => {
    for (const text of ["a", "ab", "abc", "abcd", "ção", "🎉"]) {
      expect(decodeBase64UrlToText(encodeTextToBase64Url(text))).toBe(text);
    }
  });

  it("trims titles and card text when decoding", () => {
    const result = decodeDeckFromHash(
      hashFor({
        v: 1,
        title: "  Crew  ",
        cards: [{ t: "question", x: "  Hello?  " }],
      })
    );
    expect(result).toEqual({
      isDecoded: true,
      deck: { title: "Crew", cards: [{ type: "question", text: "Hello?" }] },
    });
  });

  describe("missing", () => {
    it.each(["", "#", "#d=", "#other=abc"])("reports %j as missing", (hash) => {
      expect(decodeDeckFromHash(hash)).toEqual({
        isDecoded: false,
        reason: "missing",
      });
    });
  });

  describe("corrupt", () => {
    it("rejects characters outside base64url", () => {
      expect(decodeDeckFromHash("#d=abc$def")).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });

    it("rejects a length base64 can never produce", () => {
      expect(decodeDeckFromHash("#d=abcde")).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });

    it("rejects bytes that are not valid UTF-8", () => {
      const invalidUtf8 = btoa(String.fromCharCode(0xff, 0xfe, 0xfd))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      expect(decodeDeckFromHash(`#d=${invalidUtf8}`)).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });

    it("rejects text that is not JSON", () => {
      expect(
        decodeDeckFromHash(`#d=${encodeTextToBase64Url("not json {")}`)
      ).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });

    it.each([
      ["a missing version", undefined],
      ["a text version", "2"],
      ["an older version", 0],
    ])("treats %s as damage", (_label, version) => {
      expect(
        decodeDeckFromHash(hashFor({ ...payloadFor(sampleDeck), v: version }))
      ).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });

    it("rejects JSON that is not an object", () => {
      expect(decodeDeckFromHash(hashFor([1, 2, 3]))).toEqual({
        isDecoded: false,
        reason: "corrupt",
      });
    });
  });

  describe("too-large", () => {
    it("refuses a payload longer than the limit before decoding it", () => {
      const hash = `#d=${"a".repeat(MAX_PAYLOAD_LENGTH + 1)}`;
      expect(decodeDeckFromHash(hash)).toEqual({
        isDecoded: false,
        reason: "too-large",
        detail: "payload",
      });
    });

    it("refuses a deck with more cards than a deck can hold", () => {
      const cards = Array.from({ length: MAX_CARDS + 1 }, () => ({
        t: "question",
        x: "Hi?",
      }));
      expect(
        decodeDeckFromHash(hashFor({ v: 1, title: "Big", cards }))
      ).toEqual({
        isDecoded: false,
        reason: "too-large",
        detail: "card-count",
      });
    });
  });

  it("reads only known keys from a payload with __proto__ keys", () => {
    const rawJson =
      '{"v":1,"title":"Safe","__proto__":{"isPolluted":true},' +
      '"cards":[{"t":"question","x":"Hi?","__proto__":{"isPolluted":true}}]}';
    const result = decodeDeckFromHash(`#d=${encodeTextToBase64Url(rawJson)}`);
    expect(result).toEqual({
      isDecoded: true,
      deck: { title: "Safe", cards: [{ type: "question", text: "Hi?" }] },
    });
    expect(({} as Record<string, unknown>).isPolluted).toBeUndefined();
  });

  describe("invalid-deck", () => {
    const validPayload = payloadFor(sampleDeck);

    it("names an unknown version", () => {
      expect(decodeDeckFromHash(hashFor({ ...validPayload, v: 2 }))).toEqual({
        isDecoded: false,
        reason: "invalid-deck",
        detail: "version",
      });
    });

    it.each([
      ["a missing title", undefined, "title-empty"],
      ["a blank title", "   ", "title-empty"],
      ["a title that is a number", 42, "title-empty"],
      [
        "a title past the limit",
        "x".repeat(TITLE_MAX_LENGTH + 1),
        "title-too-long",
      ],
    ])("names %s", (_label, title, detail) => {
      expect(decodeDeckFromHash(hashFor({ ...validPayload, title }))).toEqual({
        isDecoded: false,
        reason: "invalid-deck",
        detail,
      });
    });

    it.each([
      ["an empty card list", []],
      ["a card list that is an object", { t: "question", x: "Hi?" }],
    ])("names %s", (_label, cards) => {
      expect(decodeDeckFromHash(hashFor({ ...validPayload, cards }))).toEqual({
        isDecoded: false,
        reason: "invalid-deck",
        detail: "no-cards",
      });
    });

    it.each([
      ["an unknown type", { t: "dare", x: "Hi?" }, "card-type"],
      ["blank text", { t: "question", x: "  " }, "card-empty"],
      ["text that is not a string", { t: "question", x: 7 }, "card-empty"],
      ["a card that is not an object", "Hi?", "card-empty"],
      [
        "text past the limit",
        { t: "question", x: "x".repeat(CARD_TEXT_MAX_LENGTH + 1) },
        "card-too-long",
      ],
    ])("names the card number for %s", (_label, brokenCard, detail) => {
      const cards = [...validPayload.cards, brokenCard];
      expect(decodeDeckFromHash(hashFor({ ...validPayload, cards }))).toEqual({
        isDecoded: false,
        reason: "invalid-deck",
        detail,
        cardNumber: cards.length,
      });
    });
  });
});
