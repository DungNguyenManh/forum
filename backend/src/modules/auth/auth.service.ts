import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/user.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationEmitterService } from '../../common/notification-emitter.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsGateway)) private notificationsGateway: NotificationsGateway,
    private readonly notifier: NotificationEmitterService,
  ) { }

  // 👉 Register user
  async register(data: CreateUserDto) {
    const newUser = await this.usersService.create(data);

    return {
      message: 'Đăng ký thành công',
      userId: newUser.id,   // vì trong create bạn đã return { id, email, role }
      email: newUser.email,
      role: newUser.role,
    };
  }

  // 👉 Validate login
  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.notifier.error('login_result', 'Email không tồn tại');
      throw new UnauthorizedException('Email không tồn tại');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      await this.notifier.error('login_result', 'Mật khẩu không đúng', {}, user.id);
      throw new UnauthorizedException('Mật khẩu không đúng');
    }
    return user;
  }


  // 👉 Sinh JWT token cho user truyền thống
  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const result = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
    await this.notifier.success('login_result', 'Đăng nhập thành công', { userId: user.id }, user.id);
    return result;
  }

}
