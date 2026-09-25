import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { RequestContext } from '../context/request-context';

/** Uniform JSON error shape: { statusCode, error, message, details?, requestId }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const req = host.switchToHttp().getRequest();
    const requestId = RequestContext.get()?.requestId;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong. Please try again.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else if (body && typeof body === 'object') {
        message = (body as any).message ?? exception.message;
        details = (body as any).details;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[] | undefined)?.join(', ');
        message = `A record with the same ${target ?? 'value'} already exists.`;
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = 'This record is linked to other data and cannot be changed that way.';
      } else {
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${req.method} ${req.url} — ${exception.message}`, exception.stack);
    }

    if (status >= 500 && !(exception instanceof Error)) this.logger.error(String(exception));
    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      ...(details ? { details } : {}),
      requestId,
    });
  }
}
