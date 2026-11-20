import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password?: string;

  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  @IsOptional()
  role?: Role;
}
