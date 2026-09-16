import type { AllowedImageMimeType } from '../../../shared/contracts/constants';

/**
 * A stored upload.
 *
 * `publicUrl` is null for drivers that serve files from this app's own origin
 * (the local-disk driver, under `/uploads/<storedName>`). Drivers that hand the
 * file to an external origin — object storage — return the absolute URL, and it
 * is persisted alongside the row so the URL survives a driver change.
 */
export interface StoredFile {
  storedName: string;
  publicUrl: string | null;
  mimeType: AllowedImageMimeType;
  sizeBytes: number;
}

export interface StoredFileRef {
  storedName: string;
  publicUrl: string | null;
}

export interface StorageDriver {
  readonly kind: 'local' | 'blob';

  store(buffer: Buffer, declaredMimeType: string, originalName: string): Promise<StoredFile>;

  delete(file: StoredFileRef): Promise<void>;

  /** Called once at start-up; a no-op for drivers with nothing to prepare. */
  init(): Promise<void>;

  /**
   * Extra origins the Content-Security-Policy must allow for images, because
   * the files are not served from this app's own origin.
   */
  readonly imageOrigins: readonly string[];
}

/** The URL to render for a stored file, whichever driver produced it. */
export function publicUrlFor(file: StoredFileRef): string {
  return file.publicUrl ?? `/uploads/${file.storedName}`;
}
