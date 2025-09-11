import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {

    @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
    username: string;

    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    password: string;

    @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
    confirmPassword: string;

    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

}