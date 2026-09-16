import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/index';
import { badRequest, ERROR_CODES } from '../shared/errors';
import { assertSafeStoredName, validateUpload } from './imageValidation';
import type { StorageDriver, StoredFile, StoredFileRef } from './types';

/**
 * Writes uploads to a directory on the local filesystem and serves them from
 * this app's own `/uploads` route. The directory must be persistent and must be
 * backed up alongside the database.
 */
export const localDriver: StorageDriver = {
  kind: 'local',
  imageOrigins: [],

  async init(): Promise<void> {
    await mkdir(env.uploadDir, { recursive: true });
  },

  async store(buffer, declaredMimeType, originalName): Promise<StoredFile> {
    const validated = validateUpload(buffer, declaredMimeType, originalName);

    await mkdir(env.uploadDir, { recursive: true });
    // `wx` so a name collision fails loudly instead of overwriting a file.
    await writeFile(resolveWithinUploads(validated.storedName), buffer, { flag: 'wx' });

    return { ...validated, publicUrl: null };
  },

  async delete(file: StoredFileRef): Promise<void> {
    try {
      await unlink(resolveWithinUploads(file.storedName));
    } catch (error) {
      // Already gone is fine; the database row is the source of truth.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  },
};

/**
 * Path-traversal guard. Every filesystem path in this driver goes through here,
 * and anything that would escape UPLOAD_DIR is rejected rather than clamped.
 */
export function resolveWithinUploads(storedName: string): string {
  assertSafeStoredName(storedName);

  const resolved = path.resolve(env.uploadDir, storedName);
  const root = path.resolve(env.uploadDir) + path.sep;
  if (!resolved.startsWith(root)) {
    throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  }
  return resolved;
}
