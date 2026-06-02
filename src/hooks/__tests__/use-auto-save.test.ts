import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { useAutoSave } from "../use-auto-save";
import type { PostFormData } from "@/lib/validation/autosave-schemas";
import {
  getAutoSaveStorageKey,
  AUTOSAVE_DRAFT_ID_KEY,
} from "@/lib/validation/autosave-schemas";

const POST_ID = "2d3f8c5a-1b2c-4d5e-8f90-1a2b3c4d5e6f";
const T1 = "2024-01-01T00:00:00.000Z";
const T2 = "2024-01-02T00:00:00.000Z";
const T3 = "2024-01-03T00:00:00.000Z";

const dataA: PostFormData = { title: "A", content: "content A" };
const dataB: PostFormData = { title: "B", content: "content B" };

/** A promise whose resolution is controlled externally. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

/** Bodies sent on each fetch call, parsed for assertions. */
let fetchBodies: Array<Record<string, unknown>>;

beforeEach(() => {
  fetchBodies = [];
  // The hook uses the bare `localStorage` global (a real browser global);
  // the happy-dom test env only exposes it on `window`, so alias it.
  (globalThis as { localStorage?: Storage }).localStorage =
    window.localStorage;
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("useAutoSave", () => {
  it("serializes overlapping saves and sends the freshly-advanced version (Bug A)", async () => {
    // First save is slow; the second must wait, then use the version the first
    // save committed — not the stale initialVersion.
    const first = deferred<Response>();
    let callCount = 0;

    global.fetch = mock((_url: string, options: { body: string }) => {
      callCount += 1;
      fetchBodies.push(JSON.parse(options.body));
      if (callCount === 1) return first.promise;
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T3 }),
      );
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
    );

    // Start save A (in flight), then request save B while A is still pending.
    act(() => {
      result.current.triggerSave(dataA);
    });
    act(() => {
      result.current.triggerSave(dataB);
    });

    // Only one request so far - B was queued, not sent in parallel.
    expect(callCount).toBe(1);
    expect(fetchBodies[0].expectedVersion).toBe(T1);

    // Resolve A; its success advances the version to T2, then B flushes.
    await act(async () => {
      first.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T2 }),
      );
    });

    await waitFor(() => expect(callCount).toBe(2));

    // B used the version committed by A, not the stale T1.
    expect(fetchBodies[1].expectedVersion).toBe(T2);
    expect(result.current.status).toBe("saved");
  });

  it("never enters conflict state for a serialized self-save", async () => {
    // Server returns 409 only when expectedVersion is stale (< T-latest).
    global.fetch = mock((_url: string, options: { body: string }) => {
      const body = JSON.parse(options.body);
      fetchBodies.push(body);
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T2 }),
      );
    }) as unknown as typeof fetch;

    const onConflict = mock(() => undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        postId: POST_ID,
        initialVersion: T1,
        enabled: true,
        onConflict,
      }),
    );

    await act(async () => {
      result.current.triggerSave(dataA);
    });
    await waitFor(() => expect(result.current.status).toBe("saved"));

    expect(onConflict).not.toHaveBeenCalled();
  });

  it("clears the conflict once the version is resynced (Bug B)", async () => {
    // 409 unless the client sends the up-to-date version (T2).
    global.fetch = mock((_url: string, options: { body: string }) => {
      const body = JSON.parse(options.body);
      fetchBodies.push(body);
      if (body.expectedVersion === T2) {
        return Promise.resolve(
          jsonResponse({ success: true, id: POST_ID, updatedAt: T3 }),
        );
      }
      return Promise.resolve(
        jsonResponse(
          {
            conflict: true,
            serverVersion: T2,
            serverContent: { title: "server", content: "server content" },
          },
          409,
        ),
      );
    }) as unknown as typeof fetch;

    const onConflict = mock(() => undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        postId: POST_ID,
        initialVersion: T1,
        enabled: true,
        onConflict,
      }),
    );

    // First save hits the conflict.
    await act(async () => {
      result.current.triggerSave(dataA);
    });
    await waitFor(() => expect(result.current.status).toBe("conflict"));
    expect(onConflict).toHaveBeenCalledTimes(1);

    // Resolve the conflict the way the editor page does: adopt the server
    // version, then retry.
    act(() => {
      result.current.setServerVersion(T2);
    });
    await act(async () => {
      result.current.triggerSave(dataB);
    });

    await waitFor(() => expect(result.current.status).toBe("saved"));
    // The retry sent the resynced version and was accepted.
    expect(fetchBodies[fetchBodies.length - 1].expectedVersion).toBe(T2);
    // No second conflict.
    expect(onConflict).toHaveBeenCalledTimes(1);
  });

  it("does not auto-flush a queued save after a conflict", async () => {
    const first = deferred<Response>();
    let callCount = 0;

    global.fetch = mock((_url: string, options: { body: string }) => {
      callCount += 1;
      fetchBodies.push(JSON.parse(options.body));
      if (callCount === 1) return first.promise;
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T3 }),
      );
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
    );

    act(() => {
      result.current.triggerSave(dataA); // in flight
    });
    act(() => {
      result.current.triggerSave(dataB); // queued
    });

    // The in-flight save conflicts.
    await act(async () => {
      first.resolve(
        jsonResponse(
          {
            conflict: true,
            serverVersion: T2,
            serverContent: { title: "server" },
          },
          409,
        ),
      );
    });

    await waitFor(() => expect(result.current.status).toBe("conflict"));

    // Give any (incorrect) flush a chance to fire, then assert it did not.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(callCount).toBe(1);
  });

  it("does not blow up when cancelled and unmounted mid-save", async () => {
    // fetch honors the abort signal so cancellation rejects the request.
    global.fetch = mock(
      (_url: string, options: { body: string; signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          fetchBodies.push(JSON.parse(options.body));
          options.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;

    const { result, unmount } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
    );

    act(() => {
      result.current.triggerSave(dataA);
    });
    expect(fetchBodies.length).toBe(1);

    await act(async () => {
      result.current.cancelPendingSave();
      unmount();
      await new Promise((r) => setTimeout(r, 10));
    });

    // No further requests fired after cancel.
    expect(fetchBodies.length).toBe(1);
  });

  it("drops a queued save when cancelled before the in-flight save resolves", async () => {
    const first = deferred<Response>();
    let callCount = 0;

    global.fetch = mock((_url: string, options: { body: string }) => {
      callCount += 1;
      fetchBodies.push(JSON.parse(options.body));
      if (callCount === 1) return first.promise;
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T3 }),
      );
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
    );

    act(() => {
      result.current.triggerSave(dataA); // in flight
    });
    act(() => {
      result.current.triggerSave(dataB); // queued
    });
    expect(callCount).toBe(1);

    // Cancel the way the page does on submit/navigation, then let A succeed.
    act(() => {
      result.current.cancelPendingSave();
    });
    await act(async () => {
      first.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T2 }),
      );
      await new Promise((r) => setTimeout(r, 10));
    });

    // The queued B must not flush after the queue was dropped.
    expect(callCount).toBe(1);
  });

  it("adopts the new post id, records the draft pointer, and clears the 'new' backup", async () => {
    global.fetch = mock((_url: string, options: { body: string }) => {
      fetchBodies.push(JSON.parse(options.body));
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T2, isNew: true }),
      );
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAutoSave({ postId: null, enabled: true }),
    );

    // First save for a brand-new post (postId null on the wire).
    await act(async () => {
      result.current.triggerSave(dataA);
    });
    await waitFor(() => expect(result.current.status).toBe("saved"));

    expect(fetchBodies[0].postId).toBeNull();
    // The server-assigned id is adopted for subsequent saves...
    expect(result.current.currentPostId).toBe(POST_ID);
    // ...the durable resume pointer is recorded...
    expect(window.localStorage.getItem(AUTOSAVE_DRAFT_ID_KEY)).toBe(POST_ID);
    // ...and the transient "new" backup is cleared after success.
    expect(window.localStorage.getItem(getAutoSaveStorageKey(null))).toBeNull();

    // A follow-up save targets the real id, not null (no duplicate draft).
    await act(async () => {
      result.current.triggerSave(dataB);
    });
    await waitFor(() => expect(fetchBodies.length).toBe(2));
    expect(fetchBodies[1].postId).toBe(POST_ID);
  });

  it("offers recovery when the local backup is newer than the server version", async () => {
    window.localStorage.setItem(
      getAutoSaveStorageKey(POST_ID),
      JSON.stringify({ timestamp: T3, data: dataA, serverVersion: T1 }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
    );

    await waitFor(() => expect(result.current.recoveryData).not.toBeNull());
    expect(result.current.recoveryData?.data.title).toBe(dataA.title);
  });

  it("discards (does not offer) a local backup older than the server version", async () => {
    window.localStorage.setItem(
      getAutoSaveStorageKey(POST_ID),
      JSON.stringify({ timestamp: T1, data: dataA, serverVersion: T1 }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ postId: POST_ID, initialVersion: T2, enabled: true }),
    );

    // The stale backup is purged and no recovery is offered.
    await waitFor(() =>
      expect(
        window.localStorage.getItem(getAutoSaveStorageKey(POST_ID)),
      ).toBeNull(),
    );
    expect(result.current.recoveryData).toBeNull();
  });

  it("offers recovery for a new post when a leftover 'new' backup exists", async () => {
    // New posts have no initialVersion, so any leftover crash backup (e.g. a
    // tab closed before the first save) should be offered for recovery.
    window.localStorage.setItem(
      getAutoSaveStorageKey(null),
      JSON.stringify({ timestamp: T1, data: dataA }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ postId: null, enabled: true }),
    );

    await waitFor(() => expect(result.current.recoveryData).not.toBeNull());
    expect(result.current.recoveryData?.data.content).toBe(dataA.content);
  });

  it("keeps saving to the server even when the localStorage backup write fails", async () => {
    // Simulate a full / disabled localStorage: the crash-recovery backup can't
    // be written, but the server save must still proceed (no thrown error).
    const realSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = mock(() => {
      throw new Error("QuotaExceededError");
    }) as unknown as Storage["setItem"];

    global.fetch = mock((_url: string, options: { body: string }) => {
      fetchBodies.push(JSON.parse(options.body));
      return Promise.resolve(
        jsonResponse({ success: true, id: POST_ID, updatedAt: T2 }),
      );
    }) as unknown as typeof fetch;

    try {
      const { result } = renderHook(() =>
        useAutoSave({ postId: POST_ID, initialVersion: T1, enabled: true }),
      );

      await act(async () => {
        result.current.triggerSave(dataA);
      });

      await waitFor(() => expect(result.current.status).toBe("saved"));
      expect(fetchBodies.length).toBe(1);
    } finally {
      window.localStorage.setItem = realSetItem;
    }
  });
});
