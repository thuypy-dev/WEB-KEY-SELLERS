import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';

async function createStaff() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  console.log('--- Đang tiến hành tự khởi tạo tài khoản Nhân viên ---');
  try {
    const defaultStaffs = [
      {
        email: configService.get<string>('EMAIL_STAFF') || 'staff@pdtkey.com',
        password: configService.get<string>('PASSWORD_STAFF') || 'Staff@123456',
        fullName: 'Nhân viên Hỗ trợ 01',
        role: Role.STAFF,
      },
      {
        email: configService.get<string>('EMAIL_SUPPORT') || 'support@pdtkey.com',
        password: configService.get<string>('PASSWORD_SUPPORT') || 'Staff@123456',
        fullName: 'Chăm sóc Khách hàng',
        role: Role.SUPPORT,
      },
    ];

    for (const item of defaultStaffs) {
      const passwordHashed = await argon2.hash(item.password);
      const staff = await prismaService.user.upsert({
        where: { email: item.email },
        update: {
          role: item.role,
        },
        create: {
          email: item.email,
          password: passwordHashed,
          fullName: item.fullName,
          role: item.role,
        },
      });
      console.log(`✅ Đã khởi tạo nhân viên: ${staff.fullName} (${staff.email}) - Vai trò: ${staff.role}`);
    }
  } catch (error) {
    console.error('❌ Tự khởi tạo nhân viên thất bại:', error);
    throw error;
  } finally {
    await app.close();
  }
}

createStaff().catch((error) => {
  process.exit(1);
});
