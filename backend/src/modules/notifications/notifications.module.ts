import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
    imports: [
        require('@nestjs/mongoose').MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    ],
    providers: [NotificationsGateway, NotificationsService],
    exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }