/**
 * The upload flow FileUpload uses by default (components.md FileUpload, "Upload"):
 * 1. ask for a signed URL: POST /api/app/uploads (staff) or /api/public/forms/:publicKey/uploads;
 * 2. PUT the bytes with XMLHttpRequest, which reports upload progress;
 * 3. return the file id, which the form submits as a hidden input.
 */

export type UploadProgress = (percent: number) => void;

export type FileUploader = (file: File, options: { onProgress: UploadProgress; signal: AbortSignal }) => Promise<{ id: string }>;

/** "network": the bytes did not arrive. "unreadable": the server could not read the file. */
export class UploadError extends Error {
  constructor(public readonly kind: "network" | "unreadable") {
    super(kind);
    this.name = "UploadError";
  }
}

type SignedUpload = { uploadUrl: string; fileId: string; headers?: Record<string, string> };

export function signedUrlUploader(endpoint: string): FileUploader {
  return async (file, { onProgress, signal }) => {
    let signed: SignedUpload;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        signal,
      });
      if (response.status === 422) throw new UploadError("unreadable");
      if (!response.ok) throw new UploadError("network");
      signed = (await response.json()) as SignedUpload;
    } catch (error) {
      if (error instanceof UploadError) throw error;
      throw new UploadError("network");
    }

    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", signed.uploadUrl);
      for (const [key, value] of Object.entries(signed.headers ?? {})) request.setRequestHeader(key, value);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onload = () => (request.status < 300 ? resolve() : reject(new UploadError(request.status === 422 ? "unreadable" : "network")));
      request.onerror = () => reject(new UploadError("network"));
      request.onabort = () => reject(new DOMException("Aborted", "AbortError"));
      signal.addEventListener("abort", () => request.abort(), { once: true });
      request.send(file);
    });
    return { id: signed.fileId };
  };
}
