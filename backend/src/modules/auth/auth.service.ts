import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    if (!dto.username?.trim()) throw new BadRequestException('Tên đăng nhập là bắt buộc');
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('Mật khẩu xác nhận không khớp');
    const existed = await this.userModel.exists({ email: dto.email });
    if (existed) throw new ConflictException('Email đã được đăng ký');
    const password = await bcrypt.hash(dto.password, 10);
    const { confirmPassword, ...rest } = dto as any;
    const user = await this.userModel.create({ ...rest, password });
    return user.toJSON();
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password');
    if (!user) throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    const payload = { sub: user._id.toString(), email: user.email, roles: user.roles ?? ['user'] };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
