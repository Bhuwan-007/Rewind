import {
  GameState,
  CaseFile,
  Incident,
  Option,
  IncidentResult,
  StoredCase,
  StoreV2,
  StoreV2Schema,
} from "./schema";
import { applyChoice, updateStreak } from "./game";

export const STORAGE_KEY_V1 = "rewind:v1";
export const STORAGE_KEY_V2 = "rewind:v2";

export const INITIAL_STORE_V2: StoreV2 = {
  cases: [],
  activeCaseId: null,
  wishlist: [],
  streak: 0,
  lastPlayedDate: null,
};

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
  cases: [],
  activeCaseId: null,
  wishlist: [],
};

// Cached snapshots for useSyncExternalStore
let currentStoreSnapshot: StoreV2 = INITIAL_STORE_V2;
let currentGameStateSnapshot: GameState = INITIAL_GAME_STATE;
let isSnapshotInitialized = false;

/**
 * Loads StoreV2 from localStorage, migrating from v1 if needed.
 */
export function loadStoreV2(): StoreV2 {
  if (typeof window === "undefined") {
    return INITIAL_STORE_V2;
  }

  try {
    // 1. Try reading v2
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      const res = StoreV2Schema.safeParse(parsed);
      if (res.success) {
        return res.data;
      }
      console.warn("Invalid store v2 data, rebuilding:", res.error);
    }

    // 2. Migrate from v1 if v2 does not exist
    const rawV1 = window.localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      try {
        const v1 = JSON.parse(rawV1);
        if (v1 && v1.caseFile && v1.currentIncident) {
          const migratedCase: StoredCase = {
            id: `case_${Date.now()}`,
            goal: v1.caseFile.goal || "Cybersecurity",
            caseFile: v1.caseFile,
            currentIncident: v1.currentIncident,
            currentIndex: typeof v1.currentIndex === "number" ? v1.currentIndex : 0,
            results: Array.isArray(v1.results) ? v1.results : [],
            tokens: typeof v1.tokens === "number" ? v1.tokens : 3,
            score: typeof v1.score === "number" ? v1.score : 0,
            stability: typeof v1.stability === "number" ? v1.stability : 50,
            status: v1.currentIndex >= 4 && v1.currentStep === "closed" ? "done" : "active",
            currentStep: v1.currentStep || "incident",
            disabledOptionIds: Array.isArray(v1.disabledOptionIds) ? v1.disabledOptionIds : [],
            prefetchedIncident: v1.prefetchedIncident || null,
            curveNote: v1.curveNote,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const migratedStore: StoreV2 = {
            cases: [migratedCase],
            activeCaseId: migratedCase.id,
            wishlist: [],
            streak: typeof v1.streak === "number" ? v1.streak : 1,
            lastPlayedDate: v1.lastPlayedDate || null,
          };

          window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migratedStore));
          return migratedStore;
        }
      } catch (err) {
        console.warn("Migration from v1 failed:", err);
      }
    }

    return INITIAL_STORE_V2;
  } catch (err) {
    console.error("Failed to load store v2:", err);
    return INITIAL_STORE_V2;
  }
}

/**
 * Persists StoreV2 to localStorage and refreshes cached snapshots.
 */
export function saveStoreV2(store: StoreV2): void {
  if (typeof window === "undefined") return;

  try {
    const validated = StoreV2Schema.parse(store);
    currentStoreSnapshot = validated;
    currentGameStateSnapshot = buildGameStateFromStore(validated);
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(validated));
    notifySubscribers();
  } catch (err) {
    console.error("Failed to save store v2 to localStorage:", err);
  }
}

/**
 * Maps StoreV2 into the GameState format expected by components.
 */
function buildGameStateFromStore(store: StoreV2): GameState {
  const activeCase =
    store.cases.find((c) => c.id === store.activeCaseId) ||
    store.cases.find((c) => c.status === "active") ||
    store.cases[store.cases.length - 1] ||
    null;

  return {
    caseFile: activeCase ? activeCase.caseFile : null,
    currentIncident: activeCase ? activeCase.currentIncident : null,
    currentIndex: activeCase ? activeCase.currentIndex : 0,
    tokens: activeCase ? activeCase.tokens : 3,
    score: activeCase ? activeCase.score : 0,
    stability: activeCase ? activeCase.stability : 50,
    results: activeCase ? activeCase.results : [],
    streak: store.streak,
    lastPlayedDate: store.lastPlayedDate,
    currentStep: activeCase ? activeCase.currentStep : "incident",
    disabledOptionIds: activeCase ? activeCase.disabledOptionIds : [],
    prefetchedIncident: activeCase ? activeCase.prefetchedIncident : null,
    curveNote: activeCase ? activeCase.curveNote : undefined,
    cases: store.cases,
    activeCaseId: store.activeCaseId,
    wishlist: store.wishlist,
  };
}

/**
 * Cached snapshot getter for useSyncExternalStore.
 */
export function getGameStateSnapshot(): GameState {
  if (typeof window === "undefined") {
    return INITIAL_GAME_STATE;
  }
  if (!isSnapshotInitialized) {
    currentStoreSnapshot = loadStoreV2();
    currentGameStateSnapshot = buildGameStateFromStore(currentStoreSnapshot);
    isSnapshotInitialized = true;
  }
  return currentGameStateSnapshot;
}

export function getServerSnapshot(): GameState {
  return INITIAL_GAME_STATE;
}

/**
 * Loads the raw StoreV2 snapshot.
 */
export function getStoreV2Snapshot(): StoreV2 {
  if (typeof window === "undefined") {
    return INITIAL_STORE_V2;
  }
  if (!isSnapshotInitialized) {
    getGameStateSnapshot();
  }
  return currentStoreSnapshot;
}

// Subscription mechanism for useSyncExternalStore
type Listener = () => void;
const listeners = new Set<Listener>();

function notifySubscribers() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_V2) {
      currentStoreSnapshot = loadStoreV2();
      currentGameStateSnapshot = buildGameStateFromStore(currentStoreSnapshot);
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
 * Initializes a new case:
 * - Sets currently active case to "paused"
 * - Appends the new active case (never deletes cases)
 * - Sets activeCaseId to the new case
 */
export function initCaseState(caseFile: CaseFile, firstIncident: Incident): GameState {
  const store = loadStoreV2();
  const streakUpdate = updateStreak(store.lastPlayedDate, undefined, store.streak);

  // 1. Pause any currently active case
  const updatedCases = store.cases.map((c) =>
    c.status === "active" ? { ...c, status: "paused" as const, updatedAt: new Date().toISOString() } : c
  );

  // 2. Create new active case
  const newCaseId = `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newCase: StoredCase = {
    id: newCaseId,
    goal: caseFile.goal,
    caseFile,
    currentIncident: firstIncident,
    currentIndex: 0,
    results: [],
    tokens: 3,
    score: 0,
    stability: 50,
    status: "active",
    currentStep: "incident",
    disabledOptionIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextStore: StoreV2 = {
    ...store,
    cases: [...updatedCases, newCase],
    activeCaseId: newCaseId,
    streak: streakUpdate.streak,
    lastPlayedDate: streakUpdate.lastPlayedDate,
  };

  saveStoreV2(nextStore);
  return getGameStateSnapshot();
}

/**
 * Resumes an existing case by ID:
 * - Pauses current active case if not done
 * - Sets target case to "active" (unless already done)
 * - Sets activeCaseId to targetCase.id
 */
export function resumeCase(caseId: string): GameState {
  const store = loadStoreV2();
  const target = store.cases.find((c) => c.id === caseId);
  if (!target) return getGameStateSnapshot();

  const updatedCases = store.cases.map((c) => {
    if (c.id === caseId) {
      return {
        ...c,
        status: c.status === "done" ? ("done" as const) : ("active" as const),
        updatedAt: new Date().toISOString(),
      };
    }
    if (c.status === "active") {
      return {
        ...c,
        status: "paused" as const,
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });

  const nextStore: StoreV2 = {
    ...store,
    cases: updatedCases,
    activeCaseId: caseId,
  };

  saveStoreV2(nextStore);
  return getGameStateSnapshot();
}

/**
 * Saves game state updates for the active case.
 */
export function saveGameState(state: GameState): void {
  const store = loadStoreV2();
  const activeId = store.activeCaseId;
  if (!activeId) return;

  const updatedCases = store.cases.map((c) => {
    if (c.id === activeId) {
      const isDone = (state.currentIndex >= 4 && state.currentStep === "closed") || c.status === "done";
      return {
        ...c,
        currentIndex: state.currentIndex,
        tokens: state.tokens,
        score: state.score,
        stability: state.stability,
        results: state.results,
        currentStep: state.currentStep,
        disabledOptionIds: state.disabledOptionIds,
        prefetchedIncident: state.prefetchedIncident,
        curveNote: state.curveNote,
        status: isDone ? ("done" as const) : c.status,
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });

  const nextStore: StoreV2 = {
    ...store,
    cases: updatedCases,
  };

  saveStoreV2(nextStore);
}

/**
 * Uses a rewind token on the active case and resets stability back to 50.
 */
export function consumeRewindToken(state: GameState): GameState {
  if (state.tokens <= 0) return state;

  const nextState: GameState = {
    ...state,
    tokens: Math.max(0, state.tokens - 1),
    stability: 50,
  };
  saveGameState(nextState);
  return getGameStateSnapshot();
}

/**
 * Records an incident outcome and adds points to the active case.
 */
export function recordIncidentCompletion(state: GameState, result: IncidentResult): GameState {
  const nextState: GameState = {
    ...state,
    score: state.score + result.points,
    results: [...state.results, result],
  };
  saveGameState(nextState);
  return getGameStateSnapshot();
}

/**
 * Advances the active case to the next incident.
 */
export function advanceIncident(state: GameState, nextIncident: Incident): GameState {
  const nextIndex = Math.min(4, state.currentIndex + 1);
  const nextState: GameState = {
    ...state,
    currentIndex: nextIndex,
    currentIncident: nextIncident,
    stability: 50,
  };

  // If this was incident 5, mark case as done
  const store = loadStoreV2();
  const activeId = store.activeCaseId;
  if (activeId) {
    const updatedCases = store.cases.map((c) => {
      if (c.id === activeId) {
        return {
          ...c,
          currentIndex: nextIndex,
          currentIncident: nextIncident,
          stability: 50,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    saveStoreV2({ ...store, cases: updatedCases });
  }

  return getGameStateSnapshot();
}

/**
 * Wishlist: adds a goal name to wishlist.
 */
export function addToWishlist(goal: string): StoreV2 {
  const trimmed = goal.trim();
  if (!trimmed) return getStoreV2Snapshot();

  const store = loadStoreV2();
  if (store.wishlist.includes(trimmed)) return store;

  const nextStore: StoreV2 = {
    ...store,
    wishlist: [trimmed, ...store.wishlist],
  };
  saveStoreV2(nextStore);
  return nextStore;
}

/**
 * Wishlist: removes a goal name from wishlist.
 */
export function removeFromWishlist(goal: string): StoreV2 {
  const store = loadStoreV2();
  const nextStore: StoreV2 = {
    ...store,
    wishlist: store.wishlist.filter((g) => g !== goal),
  };
  saveStoreV2(nextStore);
  return nextStore;
}

/**
 * Clears current active state (legacy support).
 */
export function clearGameState(): GameState {
  return getGameStateSnapshot();
}
