import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import { NotificationEmitterService } from '../notification-emitter.service';

@Catch(HttpException)
@Injectable()
export class HttpExceptionNotifyFilter implements ExceptionFilter {
    constructor(private readonly notifier: NotificationEmitterService) { }

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const body: any = exception.getResponse();
        const message = Array.isArray(body?.message) ? body.message.join('; ') : body?.message || exception.message;
        const userId = request?.user?.sub as string | undefined;
        this.notifier.error('request_error', message, { path: request.url, status }, userId);
        response.status(status).json({ statusCode: status, message });
    }
}