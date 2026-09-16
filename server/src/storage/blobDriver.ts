import { del, put } from '@vercel/blob';
import { env } from '../config/index';
import { logger } from '../shared/logger';
import { assertSafeStoredName, validateUpload } from './imageValidation';
import type { StorageDriver, StoredFile, StoredFileRef } from './types';

/**
 * Stores uploads in Vercel Blob, for hosts with no persistent filesystem.
 *
 * Files are public — they are questionnaire images shown to every participant —
 * and are addressed by the absolute URL Blob returns, which is persisted on the
 * media row so it keeps working even if the driver changes later.
 */
export const blobDriver: StorageDriver = {
  kind: 'blob',
  // Blob serves from its own origin, so the CSP has to allow it for images.
  imageOrigins: ['https://*.public.blob.vercel-storage.com'],

  async init(): Promise<void> {
    requireToken();
  },

  async store(buffer, declaredMimeType, originalName): Promise<StoredFile> {
    const token = requireToken();
    const validated = validateUpload(buffer, declaredMimeType, originalName);
    assertSafeStoredName(validated.storedName);

    const result = await put(`uploads/${validated.storedName}`, buffer, {
      access: 'public',
      contentType: validated.mimeType,
      // The name is already random; a second suffix would only make the URL
      // unpredictable relative to what is stored on the row.
      addRandomSuffix: false,
      token,
    });

    return { ...validated, publicUrl: result.url };
  },

  async delete(file: StoredFileRef): Promise<void> {
    if (!file.publicUrl) {
      logger.warn('blob delete skipped: row has no public url', { storedName: file.storedName });
      return;
    }
    await del(file.publicUrl, { token: requireToken() });
  },
};

/**
 * There is no start-up step on a serverless host, so the token is checked at the
 * point of use as well as at boot.
 */
function requireToken(): string {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN. Create a Blob store in the ' +
        'Vercel dashboard and it is injected automatically.',
    );
  }
  return env.BLOB_READ_WRITE_TOKEN;
}
