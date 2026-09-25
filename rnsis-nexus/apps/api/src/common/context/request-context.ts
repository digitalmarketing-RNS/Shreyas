import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request context (who, which school, from where) carried through async calls so the
 * audit logger and services can record actor/IP without threading them through every
 * function signature.
 */
export interface RequestContextData {
  requestId: string;
  schoolId?: string;
  userId?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run<T>(data: RequestContextData, fn: () => T): T {
    return storage.run(data, fn);
  },
  get(): RequestContextData | undefined {
    return storage.getStore();
  },
  set(patch: Partial<RequestContextData>) {
    const store = storage.getStore();
    if (store) Object.assign(store, patch);
  },
};
