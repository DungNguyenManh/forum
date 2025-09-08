import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email là bắt buộc' })
    email: string;

    @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên đăng nhập là bắt buộc' })
    @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
    username: string;

    @IsString({ message: 'Mật khẩu phải là chuỗi' })
    @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;

    @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi' })
    @IsNotEmpty({ message: 'Xác nhận mật khẩu là bắt buộc' })
    @MinLength(6, { message: 'Xác nhận mật khẩu phải có ít nhất 6 ký tự' })
    confirmPassword: string;
}
