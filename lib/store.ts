import { GameState, GameStateSchema, CaseFile, Incident, Option, IncidentResult } from "./schema";
import { applyChoice, updateStreak } from "./game";

export const STORAGE_KEY = "rewind:v1";

export const INITIAL_GAME_STATE: GameState = {
  caseFile: null,
  currentIncident: null,
  currentIndex: 0,
  tokens: 3,
  score: 0,
  stability: 50,
  results: [],
  streak: 0,
  lastPlayedDate: null,
};

// Cached snapshot for useSyncExternalStore to maintain stable references
let currentSnapshot: GameState = INITIAL_GAME_STATE;
let isSnapshotInitialized = false;

/**
 * Loads game state from localStorage, validating against GameStateSchema.
 * Returns INITIAL_GAME_STATE if not found or invalid.
 */
export function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return INITIAL_GAME_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_GAME_STATE;

    const parsed = JSON.parse(raw);
    const result = GameStateSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.warn("Invalid game state in localStorage, falling back to initial:", result.error);
    return INITIAL_GAME_STATE;
  } catch (err) {
    console.error("Failed to load game state from localStorage:", err);
    return INITIAL_GAME_STATE;
  }
}

/**
 * Returns a stable cached snapshot of the game state for useSyncExternalStore.
 */
export function getGameStateSnapshot(): GameState {
  if (typeof window === "undefined") {
    return INITIAL_GAME_STATE;
  }
  if (!isSnapshotInitialized) {
    currentSnapshot = loadGameState();
    isSnapshotInitialized = true;
  }
  return currentSnapshot;
}

export function getServerSnapshot(): GameState {
  return INITIAL_GAME_STATE;
}

/**
 * Persists game state to localStorage under STORAGE_KEY.
 */
export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;

  try {
    const validated = GameStateSchema.parse(state);
    currentSnapshot = validated;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    notifySubscribers();
  } catch (err) {
    console.error("Failed to save game state to localStorage:", err);
  }
}

/**
 * Clears saved game state from localStorage and returns INITIAL_GAME_STATE.
 */
export function clearGameState(): GameState {
  currentSnapshot = INITIAL_GAME_STATE;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    notifySubscribers();
  }
  return INITIAL_GAME_STATE;
}

// In-memory subscription mechanism for reactive state updates across React components
type Listener = () => void;
const listeners = new Set<Listener>();

function notifySubscribers() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);

  // Listen to changes from other tabs/windows
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      currentSnapshot = loadGameState();
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

/**
 * Helper to initialize a new case in state
 */
export function initCaseState(caseFile: CaseFile, firstIncident: Incident, currentState?: GameState): GameState {
  const base = currentState ?? loadGameState();
  const streakUpdate = updateStreak(base.lastPlayedDate, undefined, base.streak);

  const nextState: GameState = {
    caseFile,
    currentIncident: firstIncident,
    currentIndex: 0,
    tokens: 3,
    score: 0,
    stability: 50,
    results: [],
    streak: streakUpdate.streak,
    lastPlayedDate: streakUpdate.lastPlayedDate,
  };

  saveGameState(nextState);
  return nextState;
}

/**
 * Helper to record applying a choice to stability
 */
export function applyOptionChoice(state: GameState, option: Option): GameState {
  const newStability = applyChoice(state.stability, option.stability_delta);
  const nextState: GameState = {
    ...state,
    stability: newStability,
  };
  saveGameState(nextState);
  return nextState;
}

/**
 * Helper to use a rewind token and reset stability back to 50 for retry
 */
export function consumeRewindToken(state: GameState): GameState {
  if (state.tokens <= 0) return state;

  const nextState: GameState = {
    ...state,
    tokens: Math.max(0, state.tokens - 1),
    stability: 50,
  };
  saveGameState(nextState);
  return nextState;
}

/**
 * Helper to record an incident outcome and add points
 */
export function recordIncidentCompletion(state: GameState, result: IncidentResult): GameState {
  const nextState: GameState = {
    ...state,
    score: state.score + result.points,
    results: [...state.results, result],
  };
  saveGameState(nextState);
  return nextState;
}

/**
 * Helper to advance to the next incident
 */
export function advanceIncident(state: GameState, nextIncident: Incident): GameState {
  const nextIndex = Math.min(4, state.currentIndex + 1);
  const nextState: GameState = {
    ...state,
    currentIndex: nextIndex,
    currentIncident: nextIncident,
    stability: 50,
  };
  saveGameState(nextState);
  return nextState;
}
