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
      phone: user.phone,
      age: user.age,
      address: user.address,
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }

  // 👉 Xử lý đăng nhập Google
  async validateGoogleUser(googleUser: any) {
    // Kiểm tra user đã tồn tại chưa
    let user = await this.usersService.findByEmail(googleUser.email);
    if (!user) {
      // Nếu chưa có thì tạo mới, dùng giá trị mặc định cho các trường bắt buộc
      user = await this.usersService.create({
        email: googleUser.email,
        username: googleUser.firstName + ' ' + googleUser.lastName,
        password: '', // Google user không có password
        confirmPassword: '',
        phone: '0000000000', // hoặc bạn có thể random hoặc để giá trị mặc định
        avatar: googleUser.picture,
      });
    }
    // Sinh JWT token
    if (!user) throw new UnauthorizedException('Không thể tạo user Google');
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return {
      user_id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      access_token,
      role: user.role,
    };
  }
}
