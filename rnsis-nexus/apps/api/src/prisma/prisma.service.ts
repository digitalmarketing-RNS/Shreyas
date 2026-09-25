import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type Tx = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    (this as any).$on('warn', (e: Prisma.LogEvent) => this.logger.warn(e.message));
    (this as any).$on('error', (e: Prisma.LogEvent) => this.logger.error(e.message));
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run work in a serializable-safe interactive transaction with sane limits. Financial
   * mutations always go through here so ledger, invoice and payment rows move together.
   */
  tx<T>(fn: (tx: Tx) => Promise<T>, opts: { timeout?: number } = {}): Promise<T> {
    return this.$transaction(fn, { maxWait: 10_000, timeout: opts.timeout ?? 30_000 });
  }
}
