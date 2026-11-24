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
                variants: {
                    where: { isDeleted: false }
                },
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
        try {
            // 1. Check tồn tại (Chỉ cần chưa xóa mềm là được)
            const product = await this.prismaSerivce.product.findUnique({
                where: { id, isDeleted: false }
            });

            if (!product) {
                throw new NotFoundException('Không tìm thấy sản phẩm');
            }

            // 2. Xử lý Slug
            let newSlug: string | undefined = undefined;
            if (data.slug && data.slug !== product.slug) {
                newSlug = await this.checkUniqueSlug(slugify(data.slug, {
                    strict: true, trim: true, locale: 'vi', lower: true
                }));
            } else if (data.name && data.name !== product.name && !data.slug) {
                newSlug = await this.checkUniqueSlug(slugify(data.name, {
                    strict: true, trim: true, locale: 'vi', lower: true
                }));
            }

            // 3. Xử lý Keyword an toàn (Loại bỏ trùng lặp)
            let parsedKeywords: any = data.keywords;
            if (typeof parsedKeywords === 'string') {
                try {
                    parsedKeywords = JSON.parse(parsedKeywords);
                } catch {
                    parsedKeywords = [parsedKeywords];
                }
            }
            let keywordUpdate: any = undefined;
            if (parsedKeywords && Array.isArray(parsedKeywords)) {
                const cleanKeywords = Array.from(new Set(parsedKeywords
                    .filter((k: any) => k && typeof k === 'string' && k.trim() !== '')
                    .map((k: string) => k.trim())));
                keywordUpdate = {
                    set: [],
                    connectOrCreate: cleanKeywords.map((k: string) => ({
                        where: { name: k },
                        create: { name: k }
                    }))
                };
            }

            // 4. Xử lý cập nhật biến thể / gói dịch vụ (variants)
            let parsedVariants: any = data.variants;
            if (typeof parsedVariants === 'string') {
                try {
                    parsedVariants = JSON.parse(parsedVariants);
                } catch {
                    parsedVariants = [];
                }
            }

            if (parsedVariants && Array.isArray(parsedVariants) && parsedVariants.length > 0) {
                const incomingIds = parsedVariants
                    .filter((v: any) => v && v.id != null && !isNaN(Number(v.id)))
                    .map((v: any) => Number(v.id));

                // Xóa mềm các variant cũ không còn nằm trong danh sách gửi lên
                await this.prismaSerivce.productVariant.updateMany({
                    where: {
                        productId: id,
                        isDeleted: false,
                        ...(incomingIds.length > 0 ? { id: { notIn: incomingIds } } : {})
                    },
                    data: { isDeleted: true, deletedAt: new Date() }
                });

                // Cập nhật hoặc thêm mới từng gói
                for (const v of parsedVariants) {
                    if (!v || !v.name) continue;
                    const price = Number(v.price ?? 0);
                    const orginalPrice = Number(v.orginalPrice ?? price);

                    if (v.id && !isNaN(Number(v.id))) {
                        const existingVariant = await this.prismaSerivce.productVariant.findFirst({
                            where: { id: Number(v.id), productId: id }
                        });
                        if (existingVariant) {
                            await this.prismaSerivce.productVariant.update({
                                where: { id: existingVariant.id },
                                data: {
                                    name: String(v.name),
                                    price: price,
                                    orginalPrice: orginalPrice,
                                    isDeleted: false,
                                    deletedAt: null
                                }
                            });
                        } else {
                            await this.prismaSerivce.productVariant.create({
                                data: {
                                    productId: id,
                                    name: String(v.name),
                                    price: price,
                                    orginalPrice: orginalPrice
                                }
                            });
                        }
                    } else {
                        await this.prismaSerivce.productVariant.create({
                            data: {
                                productId: id,
                                name: String(v.name),
                                price: price,
                                orginalPrice: orginalPrice
                            }
                        });
                    }
                }
            }

            // 5. Chuẩn hóa kiểu dữ liệu an toàn cho Prisma
            const isHotBool = data.isHot !== undefined 
                ? (String(data.isHot) === 'true' || data.isHot === true) 
                : undefined;
            const isActiveBool = data.isActive !== undefined 
                ? (String(data.isActive) === 'true' || data.isActive === true) 
                : undefined;
            const categoryId = data.categoryId ? Number(data.categoryId) : undefined;

            let parsedAiMetadata: any = undefined;
            if (data.aiMetadata !== undefined) {
                if (typeof data.aiMetadata === 'string') {
                    try {
                        parsedAiMetadata = JSON.parse(data.aiMetadata);
                    } catch {
                        parsedAiMetadata = data.aiMetadata;
                    }
                } else {
                    parsedAiMetadata = data.aiMetadata;
                }
            }

            // 6. Update vào DB
            return await this.prismaSerivce.product.update({
                where: { id },
                data: {
                    name: data.name,
                    slug: newSlug,
                    description: data.description,
                    thumbnail: data.thumbnail !== undefined && data.thumbnail !== '' ? data.thumbnail : undefined,
                    aiMetadata: parsedAiMetadata ?? undefined,
                    categoryId: categoryId,
                    keyword: keywordUpdate,
                    isHot: isHotBool,
                    isActive: isActiveBool
                },
                include: {
                    keyword: true,
                    variants: {
                        where: { isDeleted: false }
                    }
                }
            });
        } catch (error) {
            console.error('Lỗi AdminProductService.update:', error);
            this.handleError(error);
        }
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
        console.error('AdminProductService Error:', error);
        throw new BadRequestException(error?.message || 'Không thể xử lý yêu cầu sản phẩm');
    }
}
