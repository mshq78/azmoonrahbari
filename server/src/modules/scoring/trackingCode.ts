import { eq } from 'drizzle-orm';
import type { DbOrTx } from '../../db/client';
import { testAttempts } from '../../db/schema/index';
import { generateTrackingCode } from '../../shared/ids';

const MAX_ATTEMPTS = 12;

/**
 * Allocates a unique tracking code. The DB unique index is the real guarantee;
 * this pre-check just keeps the common path free of insert conflicts.
 */
export async function allocateTrackingCode(conn: DbOrTx): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const candidate = generateTrackingCode();
    const [existing] = await conn
      .select({ id: testAttempts.id })
      .from(testAttempts)
      .where(eq(testAttempts.trackingCode, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  throw new Error('Could not allocate a unique tracking code');
}
