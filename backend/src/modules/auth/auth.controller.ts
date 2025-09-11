import { Body, Controller, Post, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard sẽ tự redirect sang Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const u = req.user;
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

    const params = new URLSearchParams({
      access_token: u?.access_token ?? '',
      email: u?.email ?? '',
      username: u?.username ?? '',
      avatar: u?.avatar ?? '',
      role: u?.role ?? 'user',
    });

    const url = new URL('/login', frontend);
    url.search = params.toString();

    return res.redirect(url.toString());
  }
}
