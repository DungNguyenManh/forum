import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
  ) { }

  async create(dto: CreateUserDto): Promise<any> {
    try {
      if (dto.password !== dto.confirmPassword) {
        this.notificationsGateway.server.emit('userRegisterResult', { success: false, message: 'Xác nhận mật khẩu không khớp' });
        throw new BadRequestException('Xác nhận mật khẩu không khớp');
      }
      if (await this.userModel.exists({ email: dto.email })) {
        this.notificationsGateway.server.emit('userRegisterResult', { success: false, message: 'Email đã được sử dụng' });
        throw new ConflictException('Email đã được sử dụng');
      }
      if (await this.userModel.exists({ username: dto.username })) {
        this.notificationsGateway.server.emit('userRegisterResult', { success: false, message: 'Username đã được sử dụng' });
        throw new ConflictException('Username đã được sử dụng');
      }
      if (await this.userModel.exists({ phone: dto.phone })) {
        this.notificationsGateway.server.emit('userRegisterResult', { success: false, message: 'Số điện thoại đã được sử dụng' });
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
      // Mã hóa mật khẩu trước khi lưu
      const password = await bcrypt.hash(dto.password, 10);
      const user = await this.userModel.create({
        ...dto,
        password,
        role: 'user',
      });
      // Realtime: thông báo tạo user mới
      this.notificationsGateway.server.emit('userCreated', {
        userId: user._id,
        username: user.username,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      this.notificationsGateway.server.emit('userRegisterResult', { success: true, message: 'Đăng ký thành công', userId: user._id });
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
        this.notificationsGateway.server.emit('userUpdateResult', { success: false, message: 'Không tìm thấy người dùng' });
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      // Realtime: thông báo cập nhật user
      this.notificationsGateway.server.emit('userUpdated', {
        userId: user._id,
        updatedAt: new Date().toISOString(),
      });
      this.notificationsGateway.server.emit('userUpdateResult', { success: true, message: 'Cập nhật thông tin thành công', userId: user._id });
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
    this.notificationsGateway.server.emit('userDeleted', {
      userId: id,
      deletedAt: new Date().toISOString(),
    });
    // Log notification for admin
    await this.notificationsService.create('user_delete', `Người dùng đã bị xóa: ${user.username || user.email || user._id}`, id);
    return { message: 'Xóa người dùng thành công' };
  }
}