import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_EXTENSION_BY_MIME,
  type AllowedImageMimeType,
} from '../../../shared/contracts/constants';
import { env } from '../config/index';
import { badRequest, ERROR_CODES } from '../shared/errors';
import { generateStoredFileBase } from '../shared/ids';

/**
 * Magic-byte signatures. The declared MIME type and the file extension are both
 * attacker-controlled, so the bytes themselves decide what a file really is.
 */
function sniffImageType(buffer: Buffer): AllowedImageMimeType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export interface StoredFile {
  storedName: string;
  mimeType: AllowedImageMimeType;
  sizeBytes: number;
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(env.uploadDir, { recursive: true });
}

/**
 * Validates and writes one upload. The stored name is generated server-side, so
 * nothing the client supplies ever reaches the filesystem path.
 */
export async function storeImage(
  buffer: Buffer,
  declaredMimeType: string,
  originalName: string,
): Promise<StoredFile> {
  if (buffer.length === 0) throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  if (buffer.length > env.MAX_UPLOAD_BYTES) {
    throw badRequest(ERROR_CODES.FILE_TOO_LARGE);
  }

  const sniffed = sniffImageType(buffer);
  if (!sniffed) throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);

  // The declared type and the extension must agree with the bytes. SVG is never
  // accepted: it can carry script.
  const normalizedDeclared = declaredMimeType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(normalizedDeclared as AllowedImageMimeType)) {
    throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  }
  if (!mimeMatches(normalizedDeclared as AllowedImageMimeType, sniffed)) {
    throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  }
  if (!extensionMatches(originalName, sniffed)) {
    throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  }

  const storedName = `${generateStoredFileBase()}${IMAGE_EXTENSION_BY_MIME[sniffed]}`;
  await ensureUploadDir();
  await writeFile(resolveWithinUploads(storedName), buffer, { flag: 'wx' });

  return { storedName, mimeType: sniffed, sizeBytes: buffer.length };
}

export async function deleteStoredFile(storedName: string): Promise<void> {
  try {
    await unlink(resolveWithinUploads(storedName));
  } catch (error) {
    // Already gone is fine; the database row is the source of truth.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export function openStoredFile(storedName: string): NodeJS.ReadableStream {
  return createReadStream(resolveWithinUploads(storedName));
}

/**
 * Path-traversal guard. Every filesystem path in this module goes through here,
 * and anything that would escape UPLOAD_DIR is rejected rather than clamped.
 */
export function resolveWithinUploads(storedName: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(storedName) || storedName.includes('..')) {
    throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  }
  const resolved = path.resolve(env.uploadDir, storedName);
  const root = path.resolve(env.uploadDir) + path.sep;
  if (!resolved.startsWith(root)) {
    throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  }
  return resolved;
}

function mimeMatches(declared: AllowedImageMimeType, sniffed: AllowedImageMimeType): boolean {
  return declared === sniffed;
}

function extensionMatches(originalName: string, sniffed: AllowedImageMimeType): boolean {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '') return false;
  if (sniffed === 'image/jpeg') return ext === '.jpg' || ext === '.jpeg';
  return ext === IMAGE_EXTENSION_BY_MIME[sniffed];
}
