import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true })
    type: string; // e.g. 'user_register', 'user_update', 'booking_create', ...

    @Prop({ required: true })
    message: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId?: Types.ObjectId;

    @Prop({ default: false })
    read: boolean;

    @Prop({ enum: ['success', 'error', 'info'], required: false })
    status?: string;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
