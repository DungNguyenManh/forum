import { UnauthorizedException } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly jwt: JwtService) { }

    // Authenticate on connection
    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) throw new UnauthorizedException('Thiếu token');
            const payload = await this.jwt.verifyAsync(token);
            (client as any).user = { sub: payload.sub, email: payload.email, roles: payload.roles };
            // auto join personal room
            if (payload?.sub) client.join(`user:${payload.sub}`);
        } catch (e) {
            client.disconnect(true);
        }
    }

    private extractToken(client: Socket): string | null {
        // Try from auth query or Authorization header
        const qToken = (client.handshake.query?.token as string) || null;
        const header = client.handshake.headers['authorization'];
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.substring('Bearer '.length);
        }
        return qToken;
    }

    // Join rooms
    @SubscribeMessage('join')
    handleJoin(@MessageBody() data: { rooms: string[] }, @ConnectedSocket() client: Socket) {
        const rooms = data?.rooms || [];
        rooms.forEach((r) => client.join(r));
        return { joined: rooms };
    }

    // Helpers to emit events
    emitToPost(postId: string, event: string, payload: any) {
        this.server.to(`post:${postId}`).emit(event, payload);
    }

    emitToUser(userId: string, event: string, payload: any) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }
}
