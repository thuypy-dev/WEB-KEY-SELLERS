import { BadRequestException, ConflictException, Injectable, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProduct } from '../../dto/create-product.dto';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { FindAllProductDto } from '../../dto/findAll-product.dto';
import { UpdateProduct } from '../../dto/update-product.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../guard/role.guard';
import { StockStatus } from '@prisma/client';



@Injectable()
export class AdminProductService {
    constructor(private readonly prismaSerivce: PrismaService) { }

    async create(data: CreateProduct) {
        const tagOrCreate = data.keywords?.map((key) => ({
            where: { name: key },
            create: { name: key }
        }));
        const categoryExists = await this.prismaSerivce.category.findUnique({
            where: { id: data.categoryId }
        });
        if (!categoryExists) {
            throw new NotFoundException('Category không tồn tại');
        }

        let slug = data.slug ? slugify(data.slug, {
            locale: 'vi',
            lower: true,
            trim: true,
            strict: true
        }) : slugify(data.name, {
            locale: 'vi',
            lower: true,
            strict: true,
            trim: true
        });

        slug = await this.checkUniqueSlug(slug)

        try {
            const product = await this.prismaSerivce.product.create({
                data: {
                    name: data.name,
                    slug: slug,
                    description: data.description,
                    thumbnail: data.thumbnail,
                    //keywords : data.keywords ?? Prisma.JsonNull ,
                    keyword: {
                        connectOrCreate: tagOrCreate //Mảng
                    },
                    aiMetadata: data.aiMetadata ?? Prisma.JsonNull, //Object
                    categoryId: data.categoryId,
                    variants: data.variants && data.variants.length > 0 ? {
                        create: data.variants.map((v) => ({
                            name: v.name,
                            price: v.price,
                            orginalPrice: v.orginalPrice ?? v.price
                        }))
                    } : undefined
                }
            });
            return product;
        } catch (error) {
            this.handleError(error);
        }
    }

    async findAll(query?: FindAllProductDto) {
        const { page = 1, limit = 10, search, categoryId, viewDeleted = false } = query || {};
        const skip = (page - 1) * limit;

        // Admin: Lấy tất cả sản phẩm
        const whereCondition: Prisma.ProductWhereInput = {
            isDeleted: viewDeleted ? true : false,
            categoryId: categoryId ? Number(categoryId) : undefined
        }

        if (search) {
            // ... logic search ...
            whereCondition.OR = [
                { name: { contains: search } },
                { slug: { contains: search } },
                { description: { contains: search } },
                {
                    keyword: { some: { name: { contains: search } } }
                }


            ]
        }

        const [productsRaw, total] = await Promise.all([
            this.prismaSerivce.product.findMany({
                where: whereCondition,
                take: limit,
                skip: skip,
                orderBy: { updatedAt: 'desc' }, // Sắp xếp theo cập nhật mới nhất để dễ thấy sản phẩm vừa sửa
                include: {
                    category: {
                        select: { name: true, slug: true }
                    },
                    // --- NÂNG CẤP: INCLUDE BIẾN THỂ & ĐẾM STOCK ---
                    variants: {
                        where: { isDeleted: false },
                        include: {
                            _count: {
                                select: {
                                    stockItems: { where: { status: StockStatus.AVAILABLE } }
                                }
                            }
                        }
                    }
                },
            }),
            this.prismaSerivce.product.count({
                where: whereCondition
            })
        ]);

        // --- XỬ LÝ DỮ LIỆU ĐỂ TRẢ VỀ FORMAT ĐẸP CHO FRONTEND ---
        const products = productsRaw.map(p => {
            // Tính tổng tồn kho
            const totalStock = p.variants.reduce((sum, v) => sum + v._count.stockItems, 0);

            return {
                ...p,
                totalStock,
                variants: p.variants.map(v => ({
                    ...v,
                    stock: v._count.stockItems
                }))
            };
        });

        return {
            product: products, // Trả về key 'product'
            meta: {
                page,
                limit,
                totalPage: Math.ceil((total) / limit),
                total // Thêm total để biết tổng số lượng
            }
        }
    }

    async findOne(id: number) {
        const product = await this.prismaSerivce.product.findUnique({
            where: { id, isDeleted: false },
            include: {
                variants: true,
                keyword: true,
                //reviews : {take : 5, orderBy : {createdAt : 'desc'}  } //lấy luôn cmt nhưng mà chờ chắc còn xa : ) 
            }
        });
        if (!product) {
            throw new NotFoundException('Sản phẩm không tìm thấy');
        }
        return product;
    }



    async update(id: number, data: UpdateProduct) {
        // 1. Check tồn tại (Chỉ cần chưa xóa mềm là được)
        const product = await this.prismaSerivce.product.findUnique({
            where: { id, isDeleted: false }
        });

        if (!product) {
            throw new NotFoundException('Không tìm thấy sản phẩm');
        }

        // 2. Xử lý Slug (Giữ nguyên logic của bạn)
        let newSlug: string | undefined = undefined;
        if (data.slug && data.slug !== product.slug) {
            newSlug = await this.checkUniqueSlug(slugify(data.slug, {
                strict: true, trim: true, locale: 'vi', lower: true
            }));
        }
        if (data.name && data.name !== product.name && !data.slug) {
            newSlug = await this.checkUniqueSlug(slugify(data.name, {
                strict: true, trim: true, locale: 'vi', lower: true
            }));
        }

        // 3. Xử lý Keyword (Giữ nguyên)
        let keywordUpdate: any;
        if (data.keywords) {
            keywordUpdate = {
                set: [],
                connectOrCreate: data.keywords.map((k) => ({
                    where: { name: k },
                    create: { name: k }
                }))
            }
        }

        // 4. Xử lý cập nhật biến thể / gói dịch vụ (variants)
        if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
            const existingVariants = await this.prismaSerivce.productVariant.findMany({
                where: { productId: id, isDeleted: false }
            });
            const incomingIds = data.variants
                .filter(v => v.id != null)
                .map(v => Number(v.id));

            // Xóa mềm các variant cũ không còn được giữ lại
            const toDelete = existingVariants.filter(ev => !incomingIds.includes(ev.id));
            if (toDelete.length > 0) {
                await this.prismaSerivce.productVariant.updateMany({
                    where: { id: { in: toDelete.map(v => v.id) } },
                    data: { isDeleted: true, deletedAt: new Date() }
                });
            }

            // Cập nhật hoặc thêm mới từng gói
            for (const v of data.variants) {
                if (v.id && existingVariants.some(ev => ev.id === Number(v.id))) {
                    await this.prismaSerivce.productVariant.update({
                        where: { id: Number(v.id) },
                        data: {
                            name: v.name,
                            price: v.price,
                            orginalPrice: v.orginalPrice ?? v.price
                        }
                    });
                } else {
                    await this.prismaSerivce.productVariant.create({
                        data: {
                            productId: id,
                            name: v.name,
                            price: v.price,
                            orginalPrice: v.orginalPrice ?? v.price
                        }
                    });
                }
            }
        }

        // 5. Update vào DB (ĐÃ BỔ SUNG isHot & isActive & variants)
        return await this.prismaSerivce.product.update({
            // 👇 QUAN TRỌNG: Bỏ điều kiện isActive: true để Admin sửa được cả bài đang ẩn
            where: { id },
            data: {
                name: data.name,
                slug: newSlug,
                description: data.description,
                thumbnail: data.thumbnail,
                aiMetadata: data.aiMetadata ?? undefined,
                categoryId: data.categoryId ? Number(data.categoryId) : undefined,
                keyword: keywordUpdate,

                // 👇 QUAN TRỌNG: Thêm 2 dòng này thì mới lưu được trạng thái
                isHot: data.isHot,
                isActive: data.isActive
            },
            include: {
                keyword: true,
                variants: {
                    where: { isDeleted: false }
                }
            }
        })

    }

    async remove(productId: number) {
        return await this.prismaSerivce.$transaction([
            this.prismaSerivce.productVariant.updateMany({
                where: { productId: productId, isDeleted: false },
                data: { isDeleted: true, deletedAt: new Date() }
            }),
            this.prismaSerivce.product.update({
                where: { id: productId },
                data: { isDeleted: true, deletedAt: new Date() }
            })
        ]);
    }

    async restore(id: number) {
        const product = await this.prismaSerivce.product.findUnique({
            where: { id }
        });
        if (!product) {
            throw new NotFoundException('Không tìm thấy sản phẩm');
        }
        if (!product.isDeleted) {
            return {
                message: "Sản phẩm vẫn đang hoạt động"
            }
        }
        if (product.isDeleted) {
            return await this.prismaSerivce.$transaction([
                this.prismaSerivce.productVariant.updateMany({
                    where: { productId: id, isDeleted: true, },
                    data: {
                        isDeleted: false, deletedAt: null
                    }
                }),
                this.prismaSerivce.product.update({
                    where: { id },
                    data: {
                        isDeleted: false, deletedAt: null
                    }
                })
            ])
        }
    }
    private async checkUniqueSlug(slugCheck: string): Promise<string> {
        let count = 1;
        let slug = slugCheck;
        while (true) {
            const exists = await this.prismaSerivce.product.findUnique({
                where: { slug: slug },
                select: { id: true }
            });
            if (!exists) break;
            slug = `${slugCheck}-${count}`
            count++;
        }
        return slug;
    }

    private handleError(error: any): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new ConflictException('Slug hoặc tên đã tồn tại');
            }
        }
        console.log(error);
        throw new BadRequestException('Không thể tạo product');
    }
}
