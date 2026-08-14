export interface ClientPerfTiming {
  method: string;
  ms: number;
}

export interface ClientPerfState {
  calls: number;
  methods: string[];
  timings: ClientPerfTiming[];
  startedAt: number;
}

const state: ClientPerfState = {
  calls: 0,
  methods: [],
  timings: [],
  startedAt: Date.now(),
};

export function resetClientPerf(): void {
  state.calls = 0;
  state.methods = [];
  state.timings = [];
  state.startedAt = Date.now();
}

export function recordClientCall(method: string, ms = 0): void {
  state.calls += 1;
  if (state.methods.length < 80) {
    state.methods.push(method);
  }
  if (state.timings.length < 80) {
    state.timings.push({ method, ms });
  }
}

export function getClientPerf(): ClientPerfState & { elapsedMs: number } {
  return {
    calls: state.calls,
    methods: [...state.methods],
    timings: state.timings.map((item) => ({ ...item })),
    startedAt: state.startedAt,
    elapsedMs: Date.now() - state.startedAt,
  };
}
