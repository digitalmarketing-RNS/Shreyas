import { config } from './config.js';

const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, silent: 99 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

/** Recent lines, so the dashboard can show what happened without shell access. */
export const recentLogs = [];

function emit(level, detail, message) {
  if (LEVELS[level] < threshold) return;
  const line = {
    at: new Date().toISOString(),
    level,
    message,
    ...(detail && Object.keys(detail).length ? { detail } : {}),
  };

  recentLogs.push(line);
  if (recentLogs.length > 300) recentLogs.shift();

  const text = `${line.at} ${level.toUpperCase().padEnd(5)} ${message}`;
  const extra = line.detail ? ` ${JSON.stringify(line.detail, replacer)}` : '';
  if (level === 'error' || level === 'warn') console.error(text + extra);
  else console.log(text + extra);
}

/** Keeps credentials and raw audio out of the log stream. */
function replacer(key, value) {
  if (/token|secret|password|apikey|api_key|payload|audio|delta/i.test(key)) return '[redacted]';
  if (value instanceof Error) return { message: value.message, stack: value.stack };
  return value;
}

const make = (level) => (detail, message) =>
  typeof detail === 'string' ? emit(level, null, detail) : emit(level, detail, message ?? '');

export const log = {
  trace: make('trace'),
  debug: make('debug'),
  info: make('info'),
  warn: make('warn'),
  error: make('error'),
};
