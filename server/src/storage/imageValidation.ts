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
 * Upload validation, shared by every storage driver so a file is checked the
 * same way wherever it ends up.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Magic-byte signatures. The declared MIME type and the file extension are both
 * attacker-controlled, so the bytes themselves decide what a file really is.
 */
function sniffImageType(buffer: Buffer): AllowedImageMimeType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
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

export interface ValidatedUpload {
  storedName: string;
  mimeType: AllowedImageMimeType;
  sizeBytes: number;
}

/**
 * Validates one upload and produces the name it will be stored under. The name
 * is generated server-side, so nothing the client supplies ever reaches a
 * filesystem path or an object key.
 */
export function validateUpload(
  buffer: Buffer,
  declaredMimeType: string,
  originalName: string,
): ValidatedUpload {
  if (buffer.length === 0) throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  if (buffer.length > env.MAX_UPLOAD_BYTES) throw badRequest(ERROR_CODES.FILE_TOO_LARGE);

  const sniffed = sniffImageType(buffer);
  if (!sniffed) throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);

  // The declared type and the extension must agree with the bytes. SVG is never
  // accepted: it can carry script.
  const declared = declaredMimeType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(declared as AllowedImageMimeType)) {
    throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  }
  if (declared !== sniffed) throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  if (!extensionMatches(originalName, sniffed)) {
    throw badRequest(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
  }

  return {
    storedName: `${generateStoredFileBase()}${IMAGE_EXTENSION_BY_MIME[sniffed]}`,
    mimeType: sniffed,
    sizeBytes: buffer.length,
  };
}

function extensionMatches(originalName: string, sniffed: AllowedImageMimeType): boolean {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '') return false;
  if (sniffed === 'image/jpeg') return ext === '.jpg' || ext === '.jpeg';
  return ext === IMAGE_EXTENSION_BY_MIME[sniffed];
}

/** Stored names are generated, so anything outside this shape is a bug or an attack. */
export function assertSafeStoredName(storedName: string): void {
  if (!/^[A-Za-z0-9._-]+$/.test(storedName) || storedName.includes('..')) {
    throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  }
}
