import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async createSession() {
    const session = await this.prisma.chatSession.create({
      data: {
        title: `Hội thoại ${new Date().toLocaleString('vi-VN')}`,
      },
    });
    return {
      sessionId: session.id,
    };
  }

  async getHistory(sessionId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new HttpException('Session không tồn tại', HttpStatus.NOT_FOUND);
    }

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(sessionId: number, userContent: string) {
    const previousMessage = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { role: true, content: true },
    });

    const historyForAI = previousMessage.reverse();

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userContent,
      },
    });

    let bot_intent = 'consulting';
    let botAnswer = 'Xin lỗi, hiện trợ lý ảo đang bận một chút, bạn vui lòng để lại lời nhắn nhé!';
    let recommendedProducts: any[] = [];

    const geminiKey = process.env.GEMINI_API_KEY;

    // ƯU TIÊN 1: Chạy trực tiếp qua Cloud Gemini API (Siêu nhẹ, cực nhanh, không tốn RAM)
    if (geminiKey) {
      try {
        const activeProducts = await this.prisma.product.findMany({
          where: { isActive: true, isDeleted: false },
          take: 20,
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            variants: {
              take: 1,
              orderBy: { price: 'asc' },
              select: { price: true },
            },
          },
        });

        const productContext = activeProducts
          .map(
            (p) =>
              `- ID: ${p.id}, Tên: "${p.name}", Giá: ${Number(p.variants[0]?.price || 0).toLocaleString()}đ`,
          )
          .join('\n');

        const systemInstruction = `Bạn là Trợ lý AI bán hàng và CSKH chính thức của cửa hàng "PDTKEY Store" (website: pdtkey-sellers.store).
Nhiệm vụ: Tư vấn sản phẩm, hướng dẫn kích hoạt key, giải đáp chính sách bảo hành một cách nhiệt tình, lịch sự, ngắn gọn và hữu ích bằng tiếng Việt.
Chính sách:
- Bảo hành 1 đổi 1 hoặc hoàn tiền trong suốt thời hạn sử dụng nếu có lỗi từ nhà sản xuất.
- Key bản quyền gửi tự động lập tức ngay sau khi thanh toán thành công.

Danh sách sản phẩm hiện có trong kho hàng:
${productContext}

YÊU CẦU ĐỊNH DẠNG TRẢ VỀ DUY NHẤT LÀ JSON:
{
  "answer": "Lời giải đáp hoặc tư vấn chi tiết cho khách hàng",
  "intent": "tư vấn sản phẩm / hướng dẫn mua / bảo hành / chào hỏi",
  "product_ids": [mảng các ID sản phẩm phù hợp gợi ý cho khách, ví dụ: [1, 2]]
}`;

        const contents = [
          ...historyForAI.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
          {
            role: 'user',
            parts: [{ text: userContent }],
          },
        ];

        const candidateModels = [
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-3.8-flash',
          'gemini-flash-latest',
        ];

        let textOutput: string | null = null;

        for (const modelName of candidateModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
            const response = await lastValueFrom(
              this.httpService.post(
                geminiUrl,
                {
                  system_instruction: {
                    parts: [{ text: systemInstruction }],
                  },
                  contents: contents,
                  generationConfig: {
                    response_mime_type: 'application/json',
                    temperature: 0.7,
                  },
                },
                { timeout: 15000 },
              ),
            );

            textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput) break; // Thành công, thoát vòng lặp
          } catch (modelError: any) {
            console.warn(`Thử model ${modelName} thất bại, chuyển sang model kế tiếp...`);
          }
        }
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          botAnswer = parsed.answer || parsed.response || parsed.message || botAnswer;
          bot_intent = parsed.intent || bot_intent;
          const productIds = parsed.product_ids || [];

          if (Array.isArray(productIds) && productIds.length > 0) {
            recommendedProducts = activeProducts.filter((p) => productIds.includes(p.id));
          }
        }
      } catch (geminiError: any) {
        console.error('Lỗi gọi Cloud Gemini API:', geminiError.response?.data || geminiError.message);
      }
    } else {
      // DỰ PHÒNG: Thử gọi microservice AI Python nếu có
      try {
        const pythonUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ask';
        const response = await lastValueFrom(
          this.httpService.post(
            pythonUrl,
            {
              question: userContent,
              history: historyForAI,
            },
            { timeout: 10000 },
          ),
        );
        const data = response.data;
        bot_intent = data.intent;
        botAnswer = data.answer;
        const productIds = data.product_ids || [];
        if (Array.isArray(productIds) && productIds.length > 0) {
          recommendedProducts = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isDeleted: false, isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
              variants: {
                take: 1,
                orderBy: { price: 'asc' },
                select: { price: true },
              },
            },
          });
        }
      } catch (err: any) {
        console.log('Lỗi gọi AI dự phòng:', err.message);
      }
    }

    // DỰ PHÒNG NỘI BỘ: Nếu AI bên ngoài không phản hồi, tự động tư vấn thông minh dựa trên dữ liệu sản phẩm trong DB
    if (botAnswer.includes('đang bận') || botAnswer.includes('Xin lỗi')) {
      const lower = userContent.toLowerCase();
      if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        botAnswer = 'Dạ chào bạn! Tôi là trợ lý ảo của PDTKEY Store. Tôi có thể hỗ trợ bạn tìm kiếm key bản quyền hoặc giải đáp thắc mắc nào về sản phẩm ạ?';
        bot_intent = 'greeting';
      } else {
        const words = userContent.trim().split(/\s+/).filter((w) => w.length >= 2);
        const matches = await this.prisma.product.findMany({
          where: {
            isActive: true,
            isDeleted: false,
            OR: [
              { name: { contains: userContent } },
              ...words.map((w) => ({ name: { contains: w } })),
            ],
          },
          take: 3,
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            variants: {
              take: 1,
              orderBy: { price: 'asc' },
              select: { price: true },
            },
          },
        });
        if (matches.length > 0) {
          botAnswer = 'Dạ PDTKEY có sẵn các sản phẩm phù hợp với nhu cầu của bạn đây ạ. Mời bạn tham khảo chi tiết bên dưới nhé:';
          recommendedProducts = matches;
          bot_intent = 'consulting';
        }
      }
    }

    const botMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'model',
        content: botAnswer,
      },
    });

    return {
      intent: bot_intent,
      message: botMessage,
      products: recommendedProducts,
    };
  }
}
