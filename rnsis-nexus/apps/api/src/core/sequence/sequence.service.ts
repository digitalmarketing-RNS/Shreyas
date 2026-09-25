import { Injectable } from '@nestjs/common';
import { formatSequence } from '@rnsis/shared';
import { Tx } from '../../prisma/prisma.service';

/**
 * Gap-free sequential numbering (invoice, receipt, application, admission numbers).
 * The UPSERT takes a row lock that is held until the surrounding transaction commits, so
 * two concurrent receipts can never share a number, and a rolled-back transaction frees
 * its number for the next caller.
 */
@Injectable()
export class SequenceService {
  async next(tx: Tx, schoolId: string, key: string, scope: string): Promise<number> {
    const rows = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "Sequence" ("schoolId", "key", "scope", "nextValue")
      VALUES (${schoolId}, ${key}, ${scope}, 2)
      ON CONFLICT ("schoolId", "key", "scope")
      DO UPDATE SET "nextValue" = "Sequence"."nextValue" + 1
      RETURNING ("nextValue" - 1) AS value`;
    return Number(rows[0].value);
  }

  async nextFormatted(tx: Tx, schoolId: string, key: string, scope: string, prefix: string, pad = 5, sep = '/'): Promise<string> {
    const n = await this.next(tx, schoolId, key, scope);
    return formatSequence(prefix, scope, n, pad, sep);
  }
}
