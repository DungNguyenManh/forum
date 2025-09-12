import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationEmitterService } from '../../common/notification-emitter.service';

@Module({
    imports: [
        require('@nestjs/mongoose').MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    ],
    providers: [NotificationsGateway, NotificationsService, NotificationEmitterService],
    exports: [NotificationsService, NotificationsGateway, NotificationEmitterService],
})
export class NotificationsModule { }