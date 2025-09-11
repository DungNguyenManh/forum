import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>,
    ) { }

    async create(type: string, message: string, userId?: string) {
        return this.notificationModel.create({ type, message, userId });
    }

    async findAll() {
        return this.notificationModel.find().sort({ createdAt: -1 }).lean();
    }

    async markAsRead(id: string) {
        return this.notificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
    }

    async remove(id: string) {
        return this.notificationModel.findByIdAndDelete(id).lean();
    }
}
