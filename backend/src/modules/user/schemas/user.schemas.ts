import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ unique: true, required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    age?: number;

    @Prop()
    address?: string;

    @Prop({ enum: ['user', 'admin'], default: 'user' })
    role: 'user' | 'admin';

    @Prop()
    avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
