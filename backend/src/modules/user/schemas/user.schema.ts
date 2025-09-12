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

    @Prop({ enum: ['user', 'admin'], default: 'user' })
    role: 'user' | 'admin';

    @Prop()
    avatar?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
// Frequently searched fields
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
// Compound for auth lookups (either username or email queries can leverage separate indexes)
