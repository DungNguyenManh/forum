import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: any) {
        this.server.emit(
            'receiveMessage',
            `Bot: Tôi đã nhận được tin nhắn: ${data}. Quản trị viên sẽ trả lời bạn sau vài phút.`
        );
    }
}