/**
 * File checks and labels for FileUpload (components.md FileUpload). The browser checks type
 * (extension and MIME) and size before uploading; the server checks again by content.
 */

const KB = 1024;
const MB = KB * 1024;

/** "7.2 MB", "512 KB", "800 bytes". One decimal from 1 MB up, none below. */
export function formatFileSize(bytes: number): string {
  if (bytes >= MB) {
    const value = bytes / MB;
    return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} MB`;
  }
  if (bytes >= KB) return `${Math.round(bytes / KB)} KB`;
  return `${bytes} ${bytes === 1 ? "byte" : "bytes"}`;
}

/** Shortens a long name in the middle, keeping the extension: "admission-fair-…-oct.csv". */
export function middleTruncate(name: string, max = 28): string {
  if ([...name].length <= max) return name;
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 && name.length - dot <= 6 ? name.slice(dot) : "";
  const stem = extension ? name.slice(0, dot) : name;
  const room = max - extension.length - 1;
  const head = Math.ceil(room * 0.6);
  const tail = room - head;
  return `${stem.slice(0, head)}…${stem.slice(stem.length - tail)}${extension}`;
}

/**
 * Whether a file is one of the accepted types. `accept` is the input's accept list:
 * extensions (".csv") and MIME types ("text/csv", "image/*").
 */
export function isAccepted(file: { name: string; type: string }, accept: readonly string[]): boolean {
  if (accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((rule) => {
    const value = rule.trim().toLowerCase();
    if (value.startsWith(".")) return name.endsWith(value);
    if (value.endsWith("/*")) return type.startsWith(value.slice(0, -1));
    return type === value;
  });
}

export type FileProblem =
  | { kind: "type"; message: string }
  | { kind: "size"; message: string }
  | { kind: "empty"; message: string };

/** The first problem with one file, in the words the spec gives ("photo.jpg is 7.2 MB. The limit is 5 MB."). */
export function checkFile(
  file: { name: string; type: string; size: number },
  { accept = [], maxBytes, typeLabel }: { accept?: readonly string[]; maxBytes?: number; typeLabel?: string },
): FileProblem | null {
  if (!isAccepted(file, accept)) {
    return { kind: "type", message: `${file.name} isn't ${typeLabel ? withArticle(typeLabel) : "a file type we accept"}.` };
  }
  if (file.size === 0) return { kind: "empty", message: `${file.name} is empty.` };
  if (maxBytes !== undefined && file.size > maxBytes) {
    return { kind: "size", message: `${file.name} is ${formatFileSize(file.size)}. The limit is ${formatFileSize(maxBytes)}.` };
  }
  return null;
}

function withArticle(label: string): string {
  return /^[aeiou]/i.test(label) && !/^(?:url|uk|us|one)/i.test(label) ? `an ${label}` : `a ${label}`;
}
