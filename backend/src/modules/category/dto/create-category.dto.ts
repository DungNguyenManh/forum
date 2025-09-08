import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
    @IsString({ message: 'Tên danh mục phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
    @MinLength(2, { message: 'Tên danh mục phải có ít nhất 2 ký tự' })
    name: string;
}
