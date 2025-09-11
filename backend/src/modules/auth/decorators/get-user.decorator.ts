import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Lấy đối tượng user (payload JWT) từ request do JwtAuthGuard/JwtStrategy gắn vào
export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req?.user;
        if (!data) return user;
        return user?.[data];
    },
);
