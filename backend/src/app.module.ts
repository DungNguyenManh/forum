import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { CommentModule } from './modules/comment/comment.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import databaseConfig from './config/database.config';
import { EventsModule } from './modules/events/events.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CategoryModule } from './modules/category/category.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NotificationEmitterService } from './common/notification-emitter.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_TTL || 60),
        limit: Number(process.env.RATE_LIMIT || 100),
      },
    ]),
    DatabaseModule,
    PostModule,
    UserModule,
    CommentModule,
    AuthModule,
    AdminModule,
    EventsModule,
    CategoryModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    NotificationEmitterService,
  ],
})
export class AppModule { }
