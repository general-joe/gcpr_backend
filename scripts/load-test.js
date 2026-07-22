#!/usr/bin/env node

const BASE_URL = process.env.LOAD_TEST_BASE_URL || "http://localhost:3000";
const TOKEN = process.env.LOAD_TEST_TOKEN || "";
const USER_ID = process.env.LOAD_TEST_USER_ID || "";
const PATIENT_ID = process.env.LOAD_TEST_PATIENT_ID || "";
const CHAT_SESSION_ID = process.env.LOAD_TEST_CHAT_SESSION_ID || "";
const CONCURRENCY = Number.parseInt(process.env.LOAD_TEST_CONCURRENCY || "10", 10);
const REQUESTS = Number.parseInt(process.env.LOAD_TEST_REQUESTS || "100", 10);

const scenarios = {
  auth: {
    method: "GET",
    path: "/auth/me",
  },
  patients: {
    method: "GET",
    path: "/cp-patient?page=1&limit=20",
  },
  assessment: {
    method: "POST",
    path: "/assessment/submit",
    body: () => ({
      patientId: PATIENT_ID,
      toolCode: "SLT_CP_BASELINE",
      responses: {
        communicationMode: "Speech and gestures",
        clinicalNotes: "Load-test submission",
      },
    }),
  },
  chat: {
    method: "POST",
    path: CHAT_SESSION_ID
      ? `/chat/sessions/${CHAT_SESSION_ID}/messages`
      : "/chat/quick",
    body: () => ({ message: "Give one caregiver home-care tip for cerebral palsy." }),
  },
};

const now = () => Number(process.hrtime.bigint()) / 1_000_000;

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runHttpScenario(name) {
  const scenario = scenarios[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}`);
  }

  if (["auth", "patients", "assessment", "chat"].includes(name) && !TOKEN) {
    throw new Error("LOAD_TEST_TOKEN is required for authenticated scenarios");
  }

  if (name === "assessment" && !PATIENT_ID) {
    throw new Error("LOAD_TEST_PATIENT_ID is required for assessment scenario");
  }

  const latencies = [];
  let completed = 0;
  let failed = 0;
  let nextRequest = 0;
  const startedAt = now();

  async function worker() {
    while (nextRequest < REQUESTS) {
      nextRequest += 1;
      const requestStartedAt = now();

      try {
        const response = await fetch(new URL(scenario.path, BASE_URL), {
          method: scenario.method,
          headers: {
            authorization: `Bearer ${TOKEN}`,
            "content-type": "application/json",
          },
          body: scenario.body ? JSON.stringify(scenario.body()) : undefined,
        });

        if (!response.ok) {
          failed += 1;
          await response.text();
        }
      } catch {
        failed += 1;
      } finally {
        completed += 1;
        latencies.push(now() - requestStartedAt);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const durationMs = now() - startedAt;
  console.log(JSON.stringify({
    scenario: name,
    baseUrl: BASE_URL,
    requests: completed,
    failed,
    concurrency: CONCURRENCY,
    durationMs: Math.round(durationMs),
    requestsPerSecond: Number((completed / (durationMs / 1000)).toFixed(2)),
    latencyMs: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
    },
  }, null, 2));
}

async function runSocketScenario() {
  if (!TOKEN || !USER_ID) {
    throw new Error("LOAD_TEST_TOKEN and LOAD_TEST_USER_ID are required for socket scenario");
  }

  if (typeof WebSocket === "undefined") {
    throw new Error("This Node.js runtime does not provide WebSocket. Run on Node 22+.");
  }

  const socketUrl = new URL("/socket.io/?EIO=4&transport=websocket", BASE_URL);
  socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";

  let completed = 0;
  let failed = 0;
  const latencies = [];
  let nextRequest = 0;
  const startedAt = now();

  async function connectAndJoin() {
    return new Promise((resolve, reject) => {
      const requestStartedAt = now();
      const ws = new WebSocket(socketUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Socket.IO load test timed out"));
      }, 10000);

      ws.onmessage = (event) => {
        const message = String(event.data);
        if (message.startsWith("0")) {
          ws.send(`40${JSON.stringify({ token: TOKEN })}`);
          return;
        }

        if (message.startsWith("40")) {
          ws.send(`42${JSON.stringify(["join-user-room", USER_ID])}`);
          clearTimeout(timeout);
          latencies.push(now() - requestStartedAt);
          ws.close();
          resolve();
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Socket.IO websocket error"));
      };
    });
  }

  async function worker() {
    while (nextRequest < REQUESTS) {
      nextRequest += 1;
      try {
        await connectAndJoin();
      } catch {
        failed += 1;
      } finally {
        completed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const durationMs = now() - startedAt;
  console.log(JSON.stringify({
    scenario: "socket",
    baseUrl: BASE_URL,
    requests: completed,
    failed,
    concurrency: CONCURRENCY,
    durationMs: Math.round(durationMs),
    requestsPerSecond: Number((completed / (durationMs / 1000)).toFixed(2)),
    latencyMs: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
    },
  }, null, 2));
}

const scenarioName = process.argv[2] || "auth";

if (scenarioName === "socket") {
  await runSocketScenario();
} else {
  await runHttpScenario(scenarioName);
}
