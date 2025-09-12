import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
const AUTH_PROVIDERS: any[] = [AuthService, JwtStrategy, LocalStrategy];

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule, // để ConfigService có thể dùng
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // đọc từ .env
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => NotificationsModule),
  ],
  providers: AUTH_PROVIDERS,
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
