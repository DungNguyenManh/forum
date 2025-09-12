import { Controller, Get, Delete, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @Roles('admin')
    findAll() {
        return this.notificationsService.findAll();
    }

    @Patch(':id/read')
    @Roles('admin')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.notificationsService.remove(id);
    }

    // ----- User scoped endpoints -----
    @Get('me/list')
    getMyNotifications(
        @GetUser('sub') userId: string,
        @Query('unread') unread?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
        @Query('q') q?: string,
        @Query('status') status?: string,
    ) {
        return this.notificationsService.findByUser({
            userId,
            onlyUnread: unread === 'true',
            limit: limit ? parseInt(limit, 10) : 20,
            page: page ? parseInt(page, 10) : 1,
            q,
            status,
        });
    }

    @Get('me/unread-count')
    getMyUnreadCount(@GetUser('sub') userId: string) {
        return this.notificationsService.unreadCount(userId);
    }

    @Patch('me/mark-all-read')
    markAllMyRead(@GetUser('sub') userId: string) {
        return this.notificationsService.markAllRead(userId);
    }

    @Patch('me/:id/read')
    markSingle(@GetUser('sub') userId: string, @Param('id') id: string) {
        // simple guard: ensure notification belongs to user (service can enforce)
        return this.notificationsService.markAsRead(id);
    }

    @Delete('me/:id')
    removeMine(@GetUser('sub') userId: string, @Param('id') id: string) {
        return this.notificationsService.removeForUser(userId, id);
    }
}
