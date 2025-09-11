import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly authService: AuthService) {
        // Derive a safe default callback that matches the Nest global prefix 'api/v1' and backend host.
        // Allow override via GOOGLE_CALLBACK_URL. If BACKEND_URL is provided we use it, else fallback to localhost:3001.
        const backendBase = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
        const defaultCallback = `${backendBase}/api/v1/auth/google/callback`;
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || defaultCallback,
            scope: ['email', 'profile'],
            prompt: 'select_account', // Luôn hiện màn hình chọn tài khoản Google
        });
        // Quick runtime hint (will only log if Google envs are present because module conditionally loads strategy)
        // Remove or downgrade as needed in production.
        // eslint-disable-next-line no-console
        console.log('[GoogleStrategy] Initialized with callback:', process.env.GOOGLE_CALLBACK_URL || defaultCallback);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
        };
        // Gọi service để lưu user và sinh JWT
        const result = await this.authService.validateGoogleUser(user);
        done(null, result);
    }
}
