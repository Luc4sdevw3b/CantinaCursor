export interface ClientPerfState {
  calls: number;
  methods: string[];
  startedAt: number;
}

const state: ClientPerfState = {
  calls: 0,
  methods: [],
  startedAt: Date.now(),
};

export function resetClientPerf(): void {
  state.calls = 0;
  state.methods = [];
  state.startedAt = Date.now();
}

export function recordClientCall(method: string): void {
  state.calls += 1;
  if (state.methods.length < 80) {
    state.methods.push(method);
  }
}

export function getClientPerf(): ClientPerfState & { elapsedMs: number } {
  return {
    calls: state.calls,
    methods: [...state.methods],
    startedAt: state.startedAt,
    elapsedMs: Date.now() - state.startedAt,
  };
}
