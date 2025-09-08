import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto) {
    const { email, username, password, confirmPassword } = createUserDto as any;
    if (!email) throw new BadRequestException('Email là bắt buộc');
    if (!username) throw new BadRequestException('Tên đăng nhập là bắt buộc');
    if (!password) throw new BadRequestException('Mật khẩu là bắt buộc');
    if (password !== confirmPassword) throw new BadRequestException('Mật khẩu xác nhận không khớp');

    const existed = await this.userModel.exists({ email });
    if (existed) throw new ConflictException('Email đã được đăng ký');

    const hashed = await bcrypt.hash(password, 10);
    const payload = { email, password: hashed, username, roles: ['user'] } as Partial<User>;
    const created = new this.userModel(payload);
    return created.save();
  }

  findAll() {
    return this.userModel.find().lean();
  }

  findOne(id: string) {
    return this.userModel.findById(id).lean();
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).lean();
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id).lean();
  }
}
