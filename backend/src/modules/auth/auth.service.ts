import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
    if (!user) throw new UnauthorizedException('Email không tồn tại');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');

    return user;
  }


  // 👉 Sinh JWT token cho user truyền thống
  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user_id: user.id,
      username: user.username,
      email: user.email,
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }

}
