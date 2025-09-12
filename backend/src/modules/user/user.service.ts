import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEmitterService } from '../../common/notification-emitter.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
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

  // FOLLOW FEATURE
  async follow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Không thể tự theo dõi chính mình');
    }
    const target = await this.userModel.findById(targetUserId).select('_id username').lean();
    if (!target) throw new NotFoundException('Người dùng cần theo dõi không tồn tại');

    try {
      const doc = await this.followModel.create({ follower: currentUserId, following: targetUserId });
      // notify the target user that someone followed them
      await this.notifier.success(
        'user_followed',
        'Bạn có người theo dõi mới',
        { followerId: currentUserId, followingId: targetUserId },
        targetUserId,
      );
      // system log for admins
      await this.notificationsService.create('user_follow', `Người dùng ${currentUserId} theo dõi ${targetUserId}`, targetUserId);
      return { message: 'Theo dõi thành công', id: doc._id.toString() };
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Bạn đã theo dõi người này');
      }
      throw err;
    }
  }

  async unfollow(currentUserId: string, targetUserId: string) {
    const res = await this.followModel.findOneAndDelete({ follower: currentUserId, following: targetUserId });
    if (!res) {
      throw new NotFoundException('Bạn chưa theo dõi người dùng này');
    }
    return { message: 'Bỏ theo dõi thành công' };
  }

  async listFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.followModel.find({ following: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', '-password')
        .lean(),
      this.followModel.countDocuments({ following: userId }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async listFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.followModel.find({ follower: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', '-password')
        .lean(),
      this.followModel.countDocuments({ follower: userId }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async isFollowing(currentUserId: string, targetUserId: string) {
    const exists = await this.followModel.exists({ follower: currentUserId, following: targetUserId });
    return { following: !!exists };
  }

}