import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateStaffDto } from '../../dto/create-staff.dto';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  // --- 1. LẤY DANH SÁCH USER ---
  async findAll(params: { page?: number; limit?: number; search?: string; role?: Role[] }) {
    const { page = 1, limit = 10, search, role } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: role && role.length > 0 ? { in: role } : undefined,
      
      OR: search ? [
        { email: { contains: search } },
        { fullName: { contains: search } }
      ] : undefined,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { // Chỉ lấy các trường cần thiết, BỎ PASSWORD
          id: true,
          email: true,
          fullName: true,
          role: true,
          balance: true,
          createdAt: true,
          _count: {
            select: { orders: true } // Đếm số đơn hàng
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPage: Math.ceil(total / limit)
      }
    };
  }

  // --- 2. LẤY CHI TIẾT 1 USER (KÈM LỊCH SỬ GIAO DỊCH) ---
  async findOne(id: string) { // Lưu ý: ID User là String (CUID)
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          take: 5, // Lấy 5 đơn gần nhất
          orderBy: { createdAt: 'desc' },
          include: {
             _count: { select: { items: true } }
          }
        },
        _count: {
            select: { orders: true, reviews: true }
        }
      }
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    
    // Loại bỏ password trước khi trả về
    const { password, ...result } = user; 
    return result;
  }

  // --- 3. TẠO TÀI KHOẢN NHÂN VIÊN MỚI ---
  async createStaff(data: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    const rawPassword = data.password && data.password.trim() !== '' ? data.password : 'Staff@123456';
    const passwordHash = await argon2.hash(rawPassword);

    const assignedRole = data.role && Object.values(Role).includes(data.role) ? data.role : Role.STAFF;

    const staff = await this.prisma.user.create({
      data: {
        email: data.email,
        password: passwordHash,
        fullName: data.fullName,
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        balance: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    return staff;
  }

  // --- 4. CẬP NHẬT THÔNG TIN / VAI TRÒ USER ---
  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.role !== undefined) updateData.role = data.role;

    // Nếu có gửi password lên thì mới hash và cập nhật
    if (data.password && data.password.trim() !== '') {
      updateData.password = await argon2.hash(data.password);
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });
  }
}