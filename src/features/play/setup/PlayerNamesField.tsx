import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { MAX_PLAYERS } from "../../../storage/progress";
import { playCopy } from "../copy";
import "./PlayerNamesField.scss";

interface PlayerRow {
  rowId: number;
  name: string;
  isLeaving: boolean;
}

interface PlayerNamesFieldProps {
  /** Names to show on mount. Read once. */
  initialNames: string[];
  /** Called with every name in order, blanks included. The game trims and drops blanks. */
  onNamesChange: (names: string[]) => void;
}

/** Two name rows always show: two players is the smallest game, so those rows cannot be removed. */
const MIN_ROW_COUNT = 2;
/** Removes a leaving row even when animationend never fires (hidden tab, test runner). */
const LEAVE_FALLBACK_MILLISECONDS = 400;

const toNames = (rows: PlayerRow[]): string[] =>
  rows.filter((row) => !row.isLeaving).map((row) => row.name);

export const PlayerNamesField = ({
  initialNames,
  onNamesChange,
}: PlayerNamesFieldProps) => {
  const copy = useCopy(playCopy).setup;
  const [rows, setRows] = useState<PlayerRow[]>(() => {
    const names = [
      ...initialNames,
      ...Array<string>(Math.max(MIN_ROW_COUNT - initialNames.length, 0)).fill(
        ""
      ),
    ];
    return names.map((name, rowId) => ({ rowId, name, isLeaving: false }));
  });
  const nextRowIdRef = useRef(Math.max(initialNames.length, MIN_ROW_COUNT));
  const inputRefs = useRef(new Map<number, HTMLInputElement>());
  const addButtonRef = useRef<HTMLButtonElement>(null);
  /** A row id, or "add" for the Add player button. Focus moves after render, once the target exists. */
  const [focusTarget, setFocusTarget] = useState<number | "add" | null>(null);
  const activeRows = rows.filter((row) => !row.isLeaving);
  const isFull = activeRows.length >= MAX_PLAYERS;
  const canRemoveRows = activeRows.length > MIN_ROW_COUNT;
  const hasLeavingRows = rows.some((row) => row.isLeaving);

  const updateRows = (nextRows: PlayerRow[]) => {
    setRows(nextRows);
    onNamesChange(toNames(nextRows));
  };

  const removeLeftRows = () =>
    setRows((current) => current.filter((row) => !row.isLeaving));

  useEffect(() => {
    if (!hasLeavingRows) return;
    const timer = window.setTimeout(
      () => setRows((current) => current.filter((row) => !row.isLeaving)),
      LEAVE_FALLBACK_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [hasLeavingRows]);

  useEffect(() => {
    if (focusTarget === null) return;
    if (focusTarget === "add") addButtonRef.current?.focus();
    else inputRefs.current.get(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const addRow = () => {
    if (isFull) return;
    const rowId = nextRowIdRef.current;
    nextRowIdRef.current += 1;
    updateRows([...rows, { rowId, name: "", isLeaving: false }]);
    setFocusTarget(rowId);
  };

  const removeRow = (rowId: number) => {
    if (!canRemoveRows) return;
    updateRows(
      rows.map((row) =>
        row.rowId === rowId ? { ...row, isLeaving: true } : row
      )
    );
    // At ten names the Add button only appears after this render, so focus waits for it.
    setFocusTarget("add");
  };

  // Enter moves to the next name, or opens a new row after a filled last one,
  // so the phone keyboard's Go key never starts the game halfway through the names.
  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const nextRow = activeRows[rowIndex + 1];
    if (nextRow) {
      inputRefs.current.get(nextRow.rowId)?.focus();
    } else if (event.currentTarget.value.trim() && !isFull) {
      addRow();
    }
  };

  return (
    <fieldset className="player-names">
      <legend className="play-setup__section-title">{copy.playersTitle}</legend>
      <p className="play-setup__section-hint">{copy.playersHint}</p>
      <ol className="player-names__list">
        {rows.map((row) => {
          const rowIndex = activeRows.indexOf(row);
          const playerNumber = rowIndex + 1;
          return (
            <li
              key={row.rowId}
              className={`player-names__row${row.isLeaving ? " player-names__row--leaving" : ""}`}
              inert={row.isLeaving}
              onAnimationEnd={(event) => {
                if (row.isLeaving && event.target === event.currentTarget)
                  removeLeftRows();
              }}
            >
              <input
                ref={(element) => {
                  if (element) inputRefs.current.set(row.rowId, element);
                  else inputRefs.current.delete(row.rowId);
                }}
                type="text"
                className="player-names__input"
                value={row.name}
                maxLength={24}
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="next"
                aria-label={formatCopy(copy.playerNameLabel, {
                  number: playerNumber,
                })}
                placeholder={copy.playerNamePlaceholder}
                onChange={(event) =>
                  updateRows(
                    rows.map((candidate) =>
                      candidate.rowId === row.rowId
                        ? { ...candidate, name: event.target.value }
                        : candidate
                    )
                  )
                }
                onKeyDown={(event) => handleKeyDown(event, rowIndex)}
              />
              {/* A leaving row keeps its button so it animates out whole. */}
              {(canRemoveRows || row.isLeaving) && (
                <button
                  type="button"
                  className="icon-button player-names__remove"
                  aria-label={formatCopy(copy.removePlayer, {
                    number: playerNumber,
                  })}
                  onClick={() => removeRow(row.rowId)}
                >
                  <FiX aria-hidden="true" size={20} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {isFull ? (
        <p className="player-names__full">{copy.playersFull}</p>
      ) : (
        <button
          ref={addButtonRef}
          type="button"
          className="button button--quiet player-names__add"
          onClick={addRow}
        >
          <FiPlus aria-hidden="true" size={20} />
          {copy.addPlayer}
        </button>
      )}
      <p className="player-names__rule">{copy.playersRule}</p>
    </fieldset>
  );
};

export default PlayerNamesField;
