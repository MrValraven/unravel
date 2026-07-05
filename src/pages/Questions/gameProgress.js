// Pure helpers for persisting game state and the 18+ confirmation in
// localStorage. Kept free of React so they can be unit-tested in isolation.
const STORAGE_KEY = "gameProgress";
const AGE_KEY = "ageConfirmed";

export const getLastGameProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch (error) {
    console.error(error);
    return {};
  }
};

export const saveGameProgress = (savedMode, savedCounter, savedTitle = "") => {
  if (savedMode === undefined || savedCounter === undefined) return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedMode, savedCounter, savedTitle })
    );
  } catch (error) {
    console.error(error);
  }
};

export const clearGameProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(error);
  }
};

// A session is only resumable when a non-empty pack was left mid-play. This is
// what prevents a finished (or empty) game from showing a dead "Resume" button.
export const getResumableSession = () => {
  const { savedMode, savedCounter, savedTitle } = getLastGameProgress();

  const isResumable =
    Array.isArray(savedMode) &&
    savedMode.length > 0 &&
    typeof savedCounter === "number" &&
    savedCounter >= 0 &&
    savedCounter < savedMode.length;

  return isResumable
    ? { savedMode, savedCounter, savedTitle: savedTitle ?? "" }
    : null;
};

export const isAgeConfirmed = () => {
  try {
    return localStorage.getItem(AGE_KEY) === "true";
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const confirmAge = () => {
  try {
    localStorage.setItem(AGE_KEY, "true");
  } catch (error) {
    console.error(error);
  }
};
