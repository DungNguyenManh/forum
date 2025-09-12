import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../modules/notifications/notifications.gateway';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { EventsGateway } from '../modules/events/events.gateway';

@Injectable()
export class NotificationEmitterService {
    constructor(
        private readonly gateway: NotificationsGateway,
        private readonly notificationsService: NotificationsService,
        private readonly eventsGateway: EventsGateway,
    ) { }

    private emitPayload(payload: any, userId?: string) {
        if (userId) {
            try { this.eventsGateway.emitToUser(userId, 'notification', payload); } catch { }
        } else {
            try { this.gateway.server.emit('notification', payload); } catch { }
        }
    }

    async success(kind: string, message: string, extra: Record<string, any> = {}, userId?: string) {
        try {
            const doc: any = await this.notificationsService.create(kind, message, userId, 'success');
            const payload = { id: doc?._id, kind, status: 'success', message, ...extra, createdAt: doc?.createdAt };
            this.emitPayload(payload, userId);
        } catch {
            const payload = { kind, status: 'success', message, ...extra };
            this.emitPayload(payload, userId);
        }
    }

    async error(kind: string, message: string, extra: Record<string, any> = {}, userId?: string) {
        try {
            const doc: any = await this.notificationsService.create(kind, message, userId, 'error');
            const payload = { id: doc?._id, kind, status: 'error', message, ...extra, createdAt: doc?.createdAt };
            this.emitPayload(payload, userId);
        } catch {
            const payload = { kind, status: 'error', message, ...extra };
            this.emitPayload(payload, userId);
        }
    }
}