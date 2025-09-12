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

    async create(type: string, message: string, userId?: string, status?: string) {
        return this.notificationModel.create({ type, message, userId, status });
    }

    async findAll() {
        return this.notificationModel.find().sort({ createdAt: -1 }).lean();
    }

    async findByUser(userId: string, onlyUnread = false, limit = 20, page = 1) {
        const filter: any = { userId };
        if (onlyUnread) filter.read = false;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.notificationModel.countDocuments(filter),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async unreadCount(userId: string) {
        return this.notificationModel.countDocuments({ userId, read: false });
    }

    async markAsRead(id: string) {
        return this.notificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
    }

    async markAllRead(userId: string) {
        await this.notificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
        return { success: true };
    }

    async remove(id: string) {
        return this.notificationModel.findByIdAndDelete(id).lean();
    }
}
