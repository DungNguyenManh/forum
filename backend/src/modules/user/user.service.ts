import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEmitterService } from '../../common/notification-emitter.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
    private readonly notifier: NotificationEmitterService,
  ) { }

  async create(dto: CreateUserDto): Promise<any> {
    try {
      if (dto.password !== dto.confirmPassword) {
        await this.notifier.error('user_register_result', 'Xác nhận mật khẩu không khớp');
        throw new BadRequestException('Xác nhận mật khẩu không khớp');
      }
      if (await this.userModel.exists({ email: dto.email })) {
        await this.notifier.error('user_register_result', 'Email đã được sử dụng');
        throw new ConflictException('Email đã được sử dụng');
      }
      if (await this.userModel.exists({ username: dto.username })) {
        await this.notifier.error('user_register_result', 'Username đã được sử dụng');
        throw new ConflictException('Username đã được sử dụng');
      }
      const password = await bcrypt.hash(dto.password, 10);
      const user = await this.userModel.create({
        ...dto,
        password,
        role: 'user',
      });
      // Realtime: thông báo tạo user mới
      await this.notifier.success('user_created', 'Tạo người dùng mới', { userId: user._id, username: user.username });
      await this.notifier.success('user_register_result', 'Đăng ký thành công', { userId: user._id }, user._id.toString());
      // Log notification for admin
      await this.notificationsService.create('user_register', `Người dùng mới đăng ký: ${user.username} (${user.email})`, user._id.toString());
      // Trả về đầy đủ thông tin user, có cả _id và id
      const { password: _, ...userObj } = user.toObject();
      return { ...userObj, id: user._id.toString(), _id: user._id.toString() };
    } catch (err) {
      // Đã emit lỗi ở trên, ném lại lỗi để controller xử lý
      throw err;
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async setRole(userId: string, role: 'user' | 'admin') {
    const doc = await this.userModel.findByIdAndUpdate(userId, { $set: { role } },
      { new: true, projection: { email: 1, role: 1 } }).lean();

    if (!doc) return null;

    return { id: doc._id.toString(), email: doc.email, role: doc.role };
  }

  async findAll() {
    return this.userModel.find().select('-password').lean();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    // Trả về cả id và _id cho frontend dễ dùng
    return { ...user, id: user._id?.toString?.() || user._id, _id: user._id?.toString?.() || user._id };
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true },
      ).select('-password').lean();
      if (!user) {
        await this.notifier.error('user_update_result', 'Không tìm thấy người dùng');
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      await this.notifier.success('user_updated', 'Cập nhật người dùng', { userId: user._id });
      await this.notifier.success('user_update_result', 'Cập nhật thông tin thành công', { userId: user._id }, user._id.toString());
      // Log notification for admin
      await this.notificationsService.create('user_update', `Người dùng cập nhật thông tin: ${user.username || user.email || user._id}`, user._id.toString());
      return user;
    } catch (err) {
      // Đã emit lỗi ở trên, ném lại lỗi để controller xử lý
      throw err;
    }
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    // Realtime: thông báo xóa user
    await this.notifier.success('user_deleted', 'Xóa người dùng thành công', { userId: id });
    // Log notification for admin
    await this.notificationsService.create('user_delete', `Người dùng đã bị xóa: ${user.username || user.email || user._id}`, id);
    return { message: 'Xóa người dùng thành công' };
  }
}