import { env } from '../config/index';
import { blobDriver } from './blobDriver';
import { localDriver } from './localDriver';
import type { StorageDriver } from './types';

/**
 * The active storage driver, chosen once at start-up.
 *
 * `local` is the default and is what a Node host uses. `blob` exists for
 * serverless hosts, where the filesystem is ephemeral and per-invocation.
 */
export const storage: StorageDriver = env.STORAGE_DRIVER === 'blob' ? blobDriver : localDriver;

export { publicUrlFor } from './types';
export type { StorageDriver, StoredFile, StoredFileRef } from './types';
export { resolveWithinUploads } from './localDriver';
