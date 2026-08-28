import { EventEmitter } from 'node:events';

/** Fans call activity out to dashboard clients without coupling the bridge to HTTP. */
export const events = new EventEmitter();
events.setMaxListeners(100);
