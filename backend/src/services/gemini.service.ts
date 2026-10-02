import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';

export type MaintenanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface MaintenanceClassificationResult {
  severity: MaintenanceSeverity;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  reason: string;
  source: 'GEMINI_AI' | 'RULE_ENGINE';
}

export interface RoommateInfo {
  fullName: string;
  studentCode: string | null;
  bedNumber: string;
}

export interface UserDormitoryContext {
  userId: number | string;
  fullName: string;
  studentCode: string | null;
  gender: string;
  role: string;
  currentRoom?: {
    roomNumber: string;
    building: string;
    floor: number;
    roomType: string;
    bedNumber: string;
    pricePerMonth: number;
    roommates: RoommateInfo[];
  } | null;
  latestRegistration?: {
    status: string;
    semester: string;
    roomNumber?: string;
    createdAt: string;
  } | null;
  pendingMaintenanceRequests?: Array<{
    title: string;
    urgency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'bot';
  content: string;
}

export interface AIResponse {
  answer: string;
  source: 'GEMINI_LIVE' | 'KNOWLEDGE_BASE_FALLBACK';
  modelUsed: string;
  isAiGenerated: boolean;
  timestamp: string;
}

export interface AIServiceStatus {
  isConfigured: boolean;
  model: string;
  provider: string;
  features: string[];
  securityMode: string;
  rateLimitInfo: {
    freeTierRPM: number;
    freeTierRPD: number;
    recommendedModel: string;
  };
}

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  // Tri thức nền tảng KTX ICTU dùng để Grounding và làm Fallback
  private static readonly DORMITORY_KNOWLEDGE = `
BỘ QUY CHẾ VÀ TRI THỨC NỀN TẢNG KÝ TÚC XÁ - TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG (ICTU):

1. GIỜ GIẤC & AN NINH TRẬT TỰ:
- Giờ mở cửa KTX: 05h30 sáng hàng ngày.
- Giờ đóng cửa KTX (Giới nghiêm): 23h00 đêm hàng ngày. Sau 23h00, cổng KTX sẽ đóng để đảm bảo an ninh.
- Sinh viên có lý do chính đáng (học tập, làm đồ án tại lab, có việc gia đình đột xuất) về muộn phải xuất trình thẻ sinh viên và ký sổ trực tại bàn Cán bộ Quản trị.
- Tuyệt đối nghiêm cấm dẫn người lạ, người khác giới vào phòng ngủ qua đêm. Khách đến thăm phải đăng ký tại phòng thường trực và rời đi trước 21h30.

2. PHÂN KHU & CƠ CẤU PHÒNG LƯU TRÚ:
- Khu Tòa A: Dành riêng cho sinh viên Nam lưu trú.
- Khu Tòa B: Dành riêng cho sinh viên Nữ lưu trú.
- Loại phòng Tiêu chuẩn (Standard): Sức chứa tối đa 4 sinh viên/phòng (4 giường đơn G1, G2, G3, G4). Đơn giá lưu trú: khoảng 450.000 VNĐ / sinh viên / tháng (chưa bao gồm chỉ số điện, nước).
- Loại phòng Chất lượng cao / VIP: Sức chứa 2 - 4 sinh viên/phòng, trang bị điều hòa nhiệt độ Inverter, bình nóng lạnh riêng. Đơn giá lưu trú: khoảng 750.000 VNĐ - 950.000 VNĐ / sinh viên / tháng.

3. QUY TRÌNH ĐĂNG KÝ LƯU TRÚ (CHECK-IN):
- Sinh viên truy cập Cổng thông tin Sinh viên -> Chọn mục "Đăng ký lưu trú".
- Lựa chọn phòng nguyện vọng phù hợp với giới tính, điền học kỳ và ghi chú hoàn cảnh/ưu tiên (nếu có).
- Ban Quản lý sẽ xét duyệt hồ sơ trong vòng 24 - 48 giờ làm việc. Sau khi được duyệt, hệ thống sẽ tự động gán vị trí giường trống cụ thể và gửi thông báo.

4. QUY TRÌNH BÁO HỎNG & SỬA CHỮA THIẾT BỊ:
- Khi phát hiện sự cố điện, nước, bóng đèn, quạt, khóa cửa, sinh viên truy cập mục "Báo hỏng cơ sở vật chất".
- Điền số phòng và mô tả hiện trạng hỏng hóc, chọn mức độ khẩn cấp (Thấp, Bình thường, Khẩn cấp).
- Đội ngũ kỹ thuật viên KTX sẽ tiếp nhận phiếu, cử thợ đến kiểm tra và khắc phục trong vòng 24 giờ.

5. NỘI QUY AN TOÀN PHÒNG CHÁY CHỮA CHÁY (PCCC):
- Nghiêm cấm tuyệt đối việc đun nấu bằng bếp gas, bếp từ, bếp điện, bếp than trong phòng ngủ.
- Nghiêm cấm tàng trữ, sử dụng chất gây nghiện, chất kích thích, pháo nổ, vũ khí hoặc tổ chức đánh bạc dưới mọi hình thức.
- Tắt toàn bộ thiết bị điện (quạt, đèn, bình nóng lạnh) khi ra khỏi phòng để tiết kiệm điện năng và phòng chống chập cháy.

6. LIÊN HỆ BAN QUẢN LÝ KTX:
- Văn phòng Quản lý: Tầng 1, Tòa nhà A Ký túc xá ICTU.
- Hotline trực ban 24/7: 0985.333.555 (Cán bộ trực ban KTX).
- Email tiếp nhận phản ánh: bqlktx@ictu.edu.vn.
`;

  // System Instruction điều hướng hành vi mô hình
  private static readonly SYSTEM_INSTRUCTION = `
Bạn là Trợ lý ảo thông minh của Ban Quản lý Ký túc xá ICTU (Đại học CNTT & TT).

VAI TRÒ VÀ NGUYÊN TẮC PHẢN HỒI:
- Thân thiện, tôn trọng, xưng hô "mình" - "bạn" (hoặc "em" tùy ngữ cảnh sinh viên).
- Được phép trả lời tự nhiên các câu chào hỏi xã giao, ngày giờ hiện tại, thời tiết chung.
- Trọng tâm chuyên môn: Cung cấp thông tin chính xác về Ký túc xá ICTU:
  + Giá phòng: Phòng tiêu chuẩn (khoảng 450.000đ/tháng), phòng chất lượng cao (khoảng 750.000đ/tháng).
  + Giờ giấc: Mở cửa 05h30, đóng cổng 23h00 hàng ngày.
  + Quy trình: Hướng dẫn nộp đơn đăng ký phòng hoặc gửi phiếu báo hỏng thiết bị khi gặp sự cố.
- Khi gặp câu hỏi nằm ngoài phạm vi KTX (toán học, lập trình, tin tức thế giới...), hãy trả lời ngắn gọn một câu lịch sự rồi khéo léo gợi ý sinh viên quay lại các vấn đề hỗ trợ đời sống KTX.

ĐỊNH DẠNG PHẢN HỒI:
- Trả lời bằng văn bản thuần túy (plain text), tự nhiên, dễ đọc.
- TUYỆT ĐỐI KHÔNG sử dụng ký tự Markdown như dấu sao in đậm (**chữ**), in nghiêng (*chữ*), hoặc dấu hoa thị gạch đầu dòng (* mục).
- Nếu cần liệt kê các ý, hãy xuống dòng và dùng dấu gạch ngang (-) hoặc đánh số thứ tự (1, 2, 3).

TRI THỨC THAM CHIẾU KTX ICTU:
${GeminiService.DORMITORY_KNOWLEDGE}
`;

  /**
   * Khởi tạo GoogleGenerativeAI client
   */
  private static getClient(): GoogleGenerativeAI | null {
    if (!this.genAI && ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY.trim());
    }
    return this.genAI;
  }

  /**
   * Kiểm tra trạng thái tích hợp dịch vụ AI
   */
  static getServiceStatus(): AIServiceStatus {
    const isConfigured = Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 10);
    return {
      isConfigured,
      model: ENV.GEMINI_MODEL,
      provider: 'Google Gemini AI (Google DeepMind)',
      features: [
        'Hỏi đáp nội quy & quy chế KTX 24/7',
        'Tra cứu hướng dẫn thủ tục đăng ký lưu trú',
        'Hướng dẫn quy trình báo hỏng & tiếp nhận sự cố',
        'Phân tích mức độ ưu tiên & gợi ý giải pháp kỹ thuật',
        'Cơ chế Fallback Rule-based đảm bảo hoạt động liên tục khi cạn quota'
      ],
      securityMode: 'Server-Side API Proxy (Khóa bảo vệ nghiêm ngặt ở Backend, tuyệt đối không lộ ở Client)',
      rateLimitInfo: {
        freeTierRPM: 15,
        freeTierRPD: 1500,
        recommendedModel: ENV.GEMINI_MODEL,
      },
    };
  }

  /**
   * Truy vấn tình trạng phòng và số chỗ trống thực tế từ CSDL
   */
  static async getRoomAvailabilitySummary(): Promise<string> {
    try {
      const rooms = await prisma.room.findMany({
        select: {
          roomNumber: true,
          building: true,
          roomType: true,
          pricePerMonth: true,
          capacity: true,
          currentOccupancy: true,
          status: true,
        },
        orderBy: [
          { building: 'asc' },
          { roomNumber: 'asc' },
        ],
      });

      if (!rooms || rooms.length === 0) {
        return 'Hiện dữ liệu phòng đang được cập nhật.';
      }

      return rooms
        .map((r: any) => {
          const vacant = Math.max(0, r.capacity - (r.currentOccupancy || 0));
          const typeStr = r.roomType === 'VIP' ? 'VIP' : 'Tiêu chuẩn';
          const statusNote = r.status === 'MAINTENANCE' ? ' (Đang bảo trì)' : (vacant === 0 ? ' (Hết chỗ)' : ` (Còn ${vacant}/${r.capacity} giường trống)`);
          return `- Phòng ${r.roomNumber} (${r.building}, ${typeStr}): ${statusNote}, giá ${Number(r.pricePerMonth).toLocaleString('vi-VN')} đ/tháng.`;
        })
        .join('\n');
    } catch (err: any) {
      console.warn('[GeminiService] Không thể tải danh sách phòng:', err.message);
      return 'Hiện dữ liệu phòng đang được cập nhật.';
    }
  }

  /**
   * Sinh câu trả lời từ Gemini hoặc Fallback Knowledge Base với hỗ trợ Multi-turn Context và Personalized User Context
   */
  static async askAI(
    userPrompt: string,
    history?: ChatHistoryItem[],
    userContext?: UserDormitoryContext
  ): Promise<AIResponse> {
    const client = this.getClient();
    const promptTrimmed = userPrompt?.trim() || '';

    if (!promptTrimmed) {
      const greeting = userContext
        ? `Xin chào **${userContext.fullName}**! Mình là Trợ lý AI Ký túc xá ICTU 🤖. Hôm nay bạn cần kiểm tra thông tin phòng ở, bạn cùng phòng, hay cần hỗ trợ gì không?`
        : 'Xin chào! Mình là Trợ lý AI Ký túc xá ICTU. Bạn cần hỗ trợ thông tin gì về nội quy, giờ giấc, phòng ở hay thủ tục đăng ký KTX hôm nay?';
      return {
        answer: GeminiService.cleanMarkdownText(greeting),
        source: 'KNOWLEDGE_BASE_FALLBACK',
        modelUsed: 'system-default',
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Lấy dữ liệu tình trạng phòng thực tế từ CSDL
    const roomSummary = await GeminiService.getRoomAvailabilitySummary();

    // Nếu đã cấu hình khóa Gemini API hợp lệ
    if (client) {
      try {
        // 1. Lấy thời gian thực tế của hệ thống
        const now = new Date();
        const currentTimeStr = now.toLocaleString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // 2. Thiết kế lại System Prompt linh hoạt, tự nhiên với thời gian thực và dữ liệu phòng
        let dynamicInstruction = `Bạn là Trợ lý ảo thông minh của Ban Quản lý Ký túc xá ICTU (Đại học CNTT & TT).
Thời điểm hiện tại: ${currentTimeStr}.

VAI TRÒ VÀ NGUYÊN TẮC PHẢN HỒI:
- Thân thiện, tôn trọng, xưng hô "mình" - "bạn" (hoặc "em" tùy ngữ cảnh sinh viên).
- Được phép trả lời tự nhiên các câu chào hỏi xã giao, ngày giờ hiện tại, thời tiết chung.
- Trọng tâm chuyên môn: Cung cấp thông tin chính xác về Ký túc xá ICTU:
  + Giá phòng: Phòng tiêu chuẩn (khoảng 450.000đ/tháng), phòng chất lượng cao (khoảng 750.000đ/tháng).
  + Giờ giấc: Mở cửa 05h30, đóng cổng 23h00 hàng ngày.
  + Quy trình: Hướng dẫn nộp đơn đăng ký phòng hoặc gửi phiếu báo hỏng thiết bị khi gặp sự cố.
- Khi gặp câu hỏi nằm ngoài phạm vi KTX (toán học, lập trình, tin tức thế giới...), hãy trả lời ngắn gọn một câu lịch sự rồi khéo léo gợi ý sinh viên quay lại các vấn đề hỗ trợ đời sống KTX.

ĐỊNH DẠNG PHẢN HỒI:
- Trả lời bằng văn bản thuần túy (plain text), tự nhiên, dễ đọc.
- TUYỆT ĐỐI KHÔNG sử dụng ký tự Markdown như dấu sao in đậm (**chữ**), in nghiêng (*chữ*), hoặc dấu hoa thị gạch đầu dòng (* mục).
- Nếu cần liệt kê các ý, hãy xuống dòng và dùng dấu gạch ngang (-) hoặc đánh số thứ tự (1, 2, 3).

TÌNH TRẠNG PHÒNG THỰC TẾ TRONG HỆ THỐNG CƠ SỞ DỮ LIỆU:
${roomSummary}

TRI THỨC THAM CHIẾU KTX ICTU:
${GeminiService.DORMITORY_KNOWLEDGE}
`;

        if (userContext) {
          let userInfoText = `\n\nTHÔNG TIN SINH VIÊN ĐANG TRÒ CHUYỆN:
- Họ và tên: ${userContext.fullName}
- Mã sinh viên: ${userContext.studentCode || 'N/A'}
- Giới tính: ${userContext.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
- Vai trò: ${userContext.role}\n`;

          if (userContext.currentRoom) {
            userInfoText += `- Phòng đang ở: Phòng ${userContext.currentRoom.roomNumber}, ${userContext.currentRoom.building}, Tầng ${userContext.currentRoom.floor}, Giường ${userContext.currentRoom.bedNumber} (Loại: ${userContext.currentRoom.roomType}, Giá: ${userContext.currentRoom.pricePerMonth.toLocaleString('vi-VN')} VNĐ/tháng)\n`;
            if (userContext.currentRoom.roommates.length > 0) {
              userInfoText += `- Các bạn cùng phòng: ${userContext.currentRoom.roommates.map(r => `${r.fullName} (MSV: ${r.studentCode || 'N/A'}, Giường ${r.bedNumber})`).join(', ')}\n`;
            } else {
              userInfoText += `- Các bạn cùng phòng: Chưa có (phòng hiện có một mình sinh viên này)\n`;
            }
          } else {
            userInfoText += `- Phòng đang ở: Hiện tại chưa được phân phòng lưu trú\n`;
          }

          if (userContext.latestRegistration) {
            userInfoText += `- Đơn đăng ký lưu trú gần nhất: Trạng thái ${userContext.latestRegistration.status} (Học kỳ: ${userContext.latestRegistration.semester})\n`;
          }

          if (userContext.pendingMaintenanceRequests && userContext.pendingMaintenanceRequests.length > 0) {
            userInfoText += `- Phiếu báo hỏng đang chờ xử lý: ${userContext.pendingMaintenanceRequests.map(m => `"${m.title}" (Mức độ: ${m.urgency}, Trạng thái: ${m.status})`).join('; ')}\n`;
          }

          dynamicInstruction += userInfoText;
        }

        const candidateModels = [
          ENV.GEMINI_MODEL.trim() || 'gemini-1.5-flash',
          'gemini-2.5-flash',
        ].filter((model, index, models) => models.indexOf(model) === index);

        let responseText = '';
        let successfulModel = '';

        for (const modelName of candidateModels) {
          try {
            const model = client.getGenerativeModel({
              model: modelName,
              systemInstruction: dynamicInstruction,
              generationConfig: {
                temperature: 0.4,
                topP: 0.8,
                maxOutputTokens: 800,
              },
              safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                  category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
              ],
            });

            // Chuẩn hóa và làm sạch lịch sử trò chuyện theo đúng đặc tả của Google Gemini API:
            // 1. Phải bắt đầu bằng role 'user' (loại bỏ lời chào mặc định ban đầu của bot)
            // 2. Các lượt trò chuyện phải luân phiên xen kẽ user <-> model
            // 3. Tin nhắn cuối cùng trong history phải là role 'model' (vì promptTrimmed sẽ là lượt user tiếp theo)
            let formattedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

            if (history && Array.isArray(history) && history.length > 0) {
              const firstUserIdx = history.findIndex(item => item && (item.role === 'user'));
              if (firstUserIdx !== -1) {
                const validItems = history.slice(firstUserIdx);
                let lastRole: 'user' | 'model' | null = null;

                for (const item of validItems) {
                  if (!item || !item.content || !item.content.trim()) continue;
                  const currentRole: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';
                  if (currentRole !== lastRole) {
                    formattedHistory.push({
                      role: currentRole,
                      parts: [{ text: item.content.trim() }],
                    });
                    lastRole = currentRole;
                  }
                }

                // Nếu lượt cuối trong history là 'user', bỏ đi để không trùng với promptTrimmed kế tiếp
                if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
                  formattedHistory.pop();
                }
              }
            }

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI Request Timeout after 8s')), 8000)
            );

            // Nếu có lịch sử hợp lệ, sử dụng chat session (Multi-turn)
            if (formattedHistory.length > 0) {
              try {
                const chat = model.startChat({ history: formattedHistory });
                const result = await Promise.race([chat.sendMessage(promptTrimmed), timeoutPromise]);
                responseText = result.response.text();
              } catch (chatErr: any) {
                console.warn(`[GeminiService] startChat (${modelName}) gặp lỗi: ${chatErr.message}. Tự động gọi generateContent...`);
                const result = await Promise.race([model.generateContent(promptTrimmed), timeoutPromise]);
                responseText = result.response.text();
              }
            } else {
              const result = await Promise.race([model.generateContent(promptTrimmed), timeoutPromise]);
              responseText = result.response.text();
            }

            if (responseText && responseText.trim().length > 0) {
              successfulModel = modelName;
              break; // Thành công, thoát vòng lặp
            }
          } catch (modelErr: any) {
            console.warn(`[GeminiService] Gọi mô hình ${modelName} thất bại:`, modelErr.message);
            if (modelErr.message?.includes('429') || modelErr.message?.includes('Quota') || modelErr.message?.includes('Timeout')) {
              break; // Thoát ngay nếu bị rate limit hoặc timeout, chuyển sang Fallback
            }
          }
        }

        if (responseText && successfulModel) {
          return {
            answer: GeminiService.cleanMarkdownText(responseText),
            source: 'GEMINI_LIVE',
            modelUsed: successfulModel,
            isAiGenerated: true,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error: any) {
        console.warn('[GeminiService API Error -> Chuyển sang Fallback Engine]:', error.message);
        // Tự động chuyển tiếp sang Fallback nếu tất cả mô hình AI đều lỗi
      }
    }

    // Fallback Engine thông minh dựa trên bộ từ khóa quy chế KTX và User Context
    const fallbackRes = this.generateFallbackAnswer(promptTrimmed, userContext, roomSummary);
    fallbackRes.answer = GeminiService.cleanMarkdownText(fallbackRes.answer);
    return fallbackRes;
  }

  /**
   * Làm sạch các ký tự Markdown (*, **) để trả về plain text thuần túy
   */
  static cleanMarkdownText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bỏ in đậm **text** -> text
      .replace(/^\s*\*\s+/gm, '- ')      // Đổi * đầu dòng thành -
      .replace(/\*(.*?)\*/g, '$1')      // Bỏ in nghiêng *text* -> text
      .replace(/\*/g, '');              // Bỏ ký tự * đơn lẻ còn sót
  }

  /**
   * Cơ chế trả lời thông minh dự phòng (Rule-based Fallback Engine) tích hợp User Context và Room Summary
   */
  private static generateFallbackAnswer(
    query: string,
    userContext?: UserDormitoryContext,
    roomSummary?: string
  ): AIResponse {
    const q = query.toLowerCase();

    let answer = '';

    // Helper khớp nhiều từ khóa (hỗ trợ cả tiếng Việt có dấu và không dấu)
    const hasKeyword = (...keywords: string[]) => keywords.some(k => q.includes(k));

    // 0. TRẢ VỀ NGÀY GIỜ THỰC TẾ CỦA SERVER, KHÔNG DÙNG GIÁ TRỊ TĨNH
    if (hasKeyword('mấy giờ', 'may gio', 'bây giờ', 'bay gio', 'hiện tại là mấy', 'hien tai la may', 'ngày hôm nay', 'ngay hom nay', 'thời gian hiện tại', 'thoi gian hien tai')) {
      answer = `Thời gian hiện tại của hệ thống là ${new Date().toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}.`;
    }
    // 1. TRA CỨU DANH SÁCH PHÒNG CÒN CHỖ / GIƯỜNG TRỐNG THỰC TẾ TỪ CSDL
    else if (hasKeyword('phòng nào còn', 'phong nao con', 'còn phòng', 'con phong', 'còn chỗ', 'con cho', 'giường trống', 'giuong trong', 'tìm phòng', 'tim phong', 'tra cứu phòng', 'tra cuu phong', 'chỗ ở', 'cho o', 'danh sách phòng', 'danh sach phong')) {
      answer = `🏢 Tình trạng các phòng lưu trú tại KTX ICTU:\n\n${roomSummary || 'Chưa thể truy vấn dữ liệu phòng từ cơ sở dữ liệu lúc này. Vui lòng mở mục Tra cứu phòng để xem trạng thái mới nhất.'}\n\nBạn có thể truy cập mục "Đăng ký lưu trú" để chọn phòng và nộp đơn online ngay nhé!`;
    }
    // 1. CÁ NHÂN HÓA: Tra cứu thông tin phòng của bản thân
    else if (hasKeyword('phòng tôi', 'phong toi', 'tôi ở phòng', 'toi o phong', 'phòng của tôi', 'phong cua toi', 'giường của tôi', 'giuong cua toi', 'tôi ở đâu', 'toi o dau', 'số phòng của tôi', 'so phong cua toi', 'tôi ở phòng nào', 'toi o phong nao')) {
      if (userContext?.currentRoom) {
        answer = `🏢 Thông tin phòng lưu trú của bạn (${userContext.fullName} - MSV: ${userContext.studentCode || 'N/A'}):
- Phòng: ${userContext.currentRoom.roomNumber}
- Tòa nhà: ${userContext.currentRoom.building} (${userContext.gender === 'FEMALE' ? 'Khu sinh viên Nữ' : 'Khu sinh viên Nam'})
- Tầng: Tầng ${userContext.currentRoom.floor}
- Vị trí giường: Giường ${userContext.currentRoom.bedNumber}
- Loại phòng: ${userContext.currentRoom.roomType === 'VIP' ? 'Phòng VIP (2 người, trang bị điều hòa Inverter & nóng lạnh)' : 'Phòng Tiêu chuẩn (4 người)'}
- Đơn giá lưu trú: ${userContext.currentRoom.pricePerMonth.toLocaleString('vi-VN')} VNĐ / tháng`;
      } else if (userContext) {
        answer = `ℹ️ Chào bạn ${userContext.fullName}, hiện tại trên hệ thống bạn chưa được phân phòng lưu trú.
Nếu bạn vừa nộp hồ sơ, vui lòng theo dõi tiến độ duyệt tại mục "Đăng ký lưu trú" hoặc liên hệ Văn phòng Quản lý Tầng 1 Tòa A nhé!`;
      } else {
        answer = `🔒 Bạn vui lòng đăng nhập vào hệ thống để mình có thể tra cứu chính xác phòng và vị trí giường cá nhân của bạn nhé!`;
      }
    }
    // 2. CÁ NHÂN HÓA: Tra cứu danh sách bạn cùng phòng
    else if (hasKeyword('bạn cùng phòng', 'ban cung phong', 'ai ở cùng', 'ai o cung', 'cùng phòng', 'cung phong', 'những ai ở cùng', 'nhung ai o cung', 'ở chung', 'o chung')) {
      if (userContext?.currentRoom) {
        if (userContext.currentRoom.roommates.length > 0) {
          const list = userContext.currentRoom.roommates
            .map((r, idx) => `${idx + 1}. ${r.fullName} (MSV: ${r.studentCode || 'Chưa cập nhật'}) — Giường ${r.bedNumber}`)
            .join('\n');
          answer = `👥 Danh sách các bạn đang ở cùng phòng ${userContext.currentRoom.roomNumber} với bạn:
${list}

Tổng số thành viên trong phòng hiện tại: ${userContext.currentRoom.roommates.length + 1} sinh viên.`;
        } else {
          answer = `Hiện tại phòng ${userContext.currentRoom.roomNumber} chỉ có một mình bạn đang lưu trú (các giường còn lại hiện đang trống).`;
        }
      } else if (userContext) {
        answer = `ℹ️ Hiện tại bạn chưa được phân phòng lưu trú nên chưa có danh sách bạn cùng phòng.`;
      } else {
        answer = `🔒 Vui lòng đăng nhập tài khoản sinh viên để xem danh sách các bạn đang ở cùng phòng với bạn nhé!`;
      }
    }
    // 3. CÁ NHÂN HÓA: Tra cứu trạng thái đơn đăng ký lưu trú
    else if (hasKeyword('đơn của tôi', 'don cua toi', 'hồ sơ của tôi', 'ho so cua toi', 'đơn được duyệt chưa', 'don duoc duyet chua', 'kết quả đơn', 'ket qua don', 'đơn đăng ký của tôi', 'don dang ky cua toi')) {
      if (userContext?.latestRegistration) {
        const reg = userContext.latestRegistration;
        const statusMap: Record<string, string> = {
          APPROVED: '✅ ĐÃ ĐƯỢC DUYỆT — Bạn đã được cấp chỗ ở thành công.',
          PENDING: '⏳ ĐANG CHỜ XÉT DUYỆT — Ban Quản lý đang xử lý hồ sơ của bạn (24 - 48h).',
          REJECTED: '❌ ĐÃ BỊ TỪ CHỐI — Hồ sơ chưa đáp ứng điều kiện hoặc phòng đã hết chỗ.',
        };
        answer = `📋 Trạng thái đơn đăng ký lưu trú mới nhất của bạn:
- Học kỳ: ${reg.semester}
- Trạng thái: ${statusMap[reg.status] || reg.status}
- Ngày nộp đơn: ${new Date(reg.createdAt).toLocaleDateString('vi-VN')}`;
      } else if (userContext) {
        answer = `Bạn chưa nộp đơn đăng ký lưu trú nào trong hệ thống. Bạn có thể truy cập mục "Đăng ký lưu trú" để chọn phòng nguyện vọng nhé!`;
      } else {
        answer = `🔒 Bạn vui lòng đăng nhập để kiểm tra trạng thái đơn đăng ký của mình nhé!`;
      }
    }
    // 4. CÁ NHÂN HÓA: Tra cứu phiếu báo hỏng thiết bị của tôi
    else if (hasKeyword('phiếu báo hỏng', 'phieu bao hong', 'báo hỏng của tôi', 'bao hong cua toi', 'sửa chữa của tôi', 'sua chua cua toi', 'tiến độ sửa', 'tien do sua', 'đã sửa chưa', 'da sua chua')) {
      if (userContext?.pendingMaintenanceRequests && userContext.pendingMaintenanceRequests.length > 0) {
        const reqList = userContext.pendingMaintenanceRequests
          .map((m, idx) => `${idx + 1}. ${m.title} (Mức độ: ${m.urgency}) — ${m.status === 'PENDING' ? '⏳ Chờ tiếp nhận' : '⚙️ Kỹ thuật đang xử lý'}`)
          .join('\n');
        answer = `🛠️ Các phiếu báo hỏng thiết bị đang được xử lý của bạn:
${reqList}

Kỹ thuật viên KTX sẽ liên hệ và khắc phục trong vòng 24 giờ.`;
      } else if (userContext) {
        answer = `Hiện tại bạn không có phiếu báo hỏng thiết bị nào đang chờ xử lý. Nếu phòng có sự cố điện/nước/cửa, bạn hãy vào mục "Báo hỏng thiết bị" để gửi yêu cầu nhé!`;
      } else {
        answer = `🔒 Bạn vui lòng đăng nhập để xem tiến độ các phiếu báo hỏng của mình nhé!`;
      }
    }
    // 5. CÁC NỘI QUY CHUNG KÝ TÚC XÁ
    else if (hasKeyword('giờ', 'gio', 'mở cửa', 'mo cua', 'đóng cửa', 'dong cua', 'giới nghiêm', 'gioi nghiem', 'về muộn', 've muon')) {
      answer = `🕒 Quy định giờ giấc ra vào Ký túc xá ICTU:
- Giờ mở cửa: 05h30 sáng hàng ngày.
- Giờ đóng cửa (giới nghiêm): 23h00 đêm hàng ngày.
- Về muộn: Nếu có việc học tập nghiên cứu đột xuất về sau 23h00, bạn cần xuất trình thẻ sinh viên và ký xác nhận vào sổ trực của cán bộ thường trực KTX.`;
    } else if (hasKeyword('giá', 'gia', 'tiền', 'tien', 'chi phí', 'chi phi', 'phí', 'phi', 'bao nhiêu', 'bao nhieu', '450', '950', 'vnd', 'vne')) {
      answer = `💰 Biểu phí lưu trú Ký túc xá ICTU:
- Phòng Tiêu chuẩn (Standard - 4 người): 450.000 VNĐ / sinh viên / tháng (4 người/phòng, giường tầng cá nhân).
- Phòng VIP (2 người): 950.000 VNĐ / sinh viên / tháng (được trang bị điều hòa Inverter và bình nước nóng riêng).
- Lưu ý: Tiền điện và nước sinh hoạt sẽ tính riêng theo chỉ số đồng hồ thực tế hàng tháng của từng phòng.`;
    } else if (hasKeyword('nữ', 'nu', 'tòa', 'toa', 'khu', 'block')) {
      answer = `🏢 Phân khu lưu trú theo giới tính tại KTX:
- Tòa A: Dành riêng cho sinh viên Nam.
- Tòa B: Dành riêng cho sinh viên Nữ.
- Quy tắc KTX nghiêm cấm sinh viên Nam sang khu Tòa B và ngược lại sau giờ sinh hoạt chung. Tuyệt đối không dẫn người khác giới ở lại qua đêm.`;
    } else if (hasKeyword('sửa', 'sua', 'hỏng', 'hong', 'báo hỏng', 'bao hong', 'bóng đèn', 'bong den', 'quạt', 'quat', 'nước', 'nuoc', 'điện', 'dien', 'khóa', 'khoa', 'maintenance', 'repair')) {
      answer = `🛠️ Quy trình báo hỏng và sửa chữa thiết bị:
1. Đăng nhập vào hệ thống và chọn mục "Báo hỏng thiết bị" trên thanh menu.
2. Nhập số phòng của bạn, chọn loại sự cố (Điện, Nước, Khóa cửa...) và chọn mức độ khẩn cấp.
3. Đội kỹ thuật KTX sẽ tiếp nhận phiếu và cử kỹ thuật viên đến khắc phục trong vòng 24 giờ làm việc.`;
    } else if (hasKeyword('đăng ký', 'dang ky', 'xin ở', 'xin o', 'hồ sơ', 'ho so', 'thủ tục', 'thu tuc', 'nộp đơn', 'nop don', 'register', 'checkin', 'check-in')) {
      answer = `📝 Quy trình nộp đơn đăng ký lưu trú KTX online:
1. Truy cập mục "Đăng ký lưu trú" trên cổng thông tin KTX.
2. Chọn phòng và học kỳ mong muốn.
3. Ban Quản lý sẽ xét duyệt trong 24-48 giờ và phân vị trí giường trống tự động cho bạn.`;
    } else if (hasKeyword('nấu ăn', 'nau an', 'cháy', 'chay', 'bếp', 'bep', 'pccc', 'an toàn', 'an toan', 'phòng cháy', 'phong chay', 'fire', 'safety')) {
      answer = `🔥 Nội quy an toàn PCCC KTX ICTU:
- Nghiêm cấm tuyệt đối việc đun nấu bằng bếp điện, bếp gas, bếp từ trong phòng ngủ.
- Không sử dụng các thiết bị sinh nhiệt công suất lớn dễ gây chập điện.
- Tắt toàn bộ điện quạt trước khi rời khỏi phòng.`;
    } else if (hasKeyword('liên hệ', 'lien he', 'số điện thoại', 'so dien thoai', 'hotline', 'cán bộ', 'can bo', 'bql', 'ban quản lý', 'van phong', 'contact', 'email')) {
      answer = `📞 Thông tin liên hệ Ban Quản lý KTX ICTU:
- Văn phòng BQL: Tầng 1, Tòa A Ký túc xá ICTU.
- Hotline trực ban 24/7: 0985.333.555.
- Email: bqlktx@ictu.edu.vn.`;
    } else {
      answer = `Dạ chào bạn! Mình là Trợ lý AI Ký túc xá ICTU. Mình có thể hỗ trợ bạn giải đáp các vấn đề sau:
- 🕒 Giờ giấc mở/đóng cửa & quy định tạm trú
- 💰 Đơn giá phòng Standard (450k) và phòng VIP (950k)
- 🏢 Phân khu Tòa A (Nam) và Tòa B (Nữ)
- 🛠️ Hướng dẫn báo hỏng cơ sở vật chất
- 📝 Quy trình nộp hồ sơ xin ở KTX online
- 🔥 Quy chế an toàn PCCC & an ninh trật tự

Bạn đang quan tâm đến nội dung nào ở trên? Hãy gõ câu hỏi để mình hỗ trợ nhé!`;
    }

    return {
      answer,
      source: 'KNOWLEDGE_BASE_FALLBACK',
      modelUsed: 'ICTU-Dormitory-RuleEngine-v1',
      isAiGenerated: false,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Phân loại mức độ khẩn cấp sự cố báo hỏng cơ sở vật chất (Smart Ticketing)
   */
  static async classifyMaintenanceIssue(
    title: string,
    description: string
  ): Promise<MaintenanceClassificationResult> {
    const combined = `${title || ''} ${description || ''}`.trim();
    if (!combined) {
      return {
        severity: 'MEDIUM',
        urgency: 'MEDIUM',
        category: 'Điện & Quạt',
        reason: 'Chưa có đủ thông tin mô tả chi tiết sự cố',
        source: 'RULE_ENGINE',
      };
    }

    // 1. Phân tích tức thì bằng Rule-based NLP Engine (độ trễ 0ms, không tiêu tốn hạn ngạch)
    const ruleResult = this.classifyByRules(combined);
    if (ruleResult.category !== 'Khác') {
      return ruleResult;
    }

    // 2. Với các trường hợp ngoại lệ không khớp từ khóa, gọi Gemini để suy luận
    const client = this.getClient();
    if (client) {
      try {
        const candidateModels = [
          ENV.GEMINI_MODEL.trim() || 'gemini-1.5-flash',
          'gemini-2.5-flash',
        ].filter((model, index, models) => models.indexOf(model) === index);

        const prompt = `Bạn là chuyên gia thẩm định và phân loại sự cố kỹ thuật Ký túc xá ICTU.
Nhiệm vụ: Phân tích tiêu đề và mô tả sự cố sau đây để xác định mức độ khẩn cấp và lý do an toàn.
Tiêu đề: "${title}"
Mô tả: "${description}"

TIÊU CHÍ PHÂN LOẠI MỨC ĐỘ (severity):
- CRITICAL: Nguy cơ chập cháy điện, rò điện, nổ bình nóng lạnh, ngập nước vỡ ống chính (nguy cơ cháy nổ, an toàn tính mạng).
- HIGH: Mất điện toàn phòng, mất nước sinh hoạt, hỏng khóa cửa phòng (ảnh hưởng trực tiếp an ninh, sinh hoạt thiết yếu).
- MEDIUM: Quạt trần rung lắc/kêu to, bóng đèn nhấp nháy, điều hòa không mát, tắc bồn rửa/cống (tiện nghi phòng ở hoạt động kém).
- LOW: Hỏng bản lề tủ, hỏng ngăn kéo, đứt dây phơi, tróc sơn bàn ghế (hao mòn phụ trợ, thẩm mỹ).

Yêu cầu: Trả về JSON duy nhất, không markdown:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "category": "Điện & Quạt" | "Cấp thoát nước" | "Cửa & Khóa" | "Giường tủ" | "Khác",
  "reason": "Lý do ngắn gọn phát hiện nguy cơ an toàn"
}`;

        for (const modelName of candidateModels) {
          try {
            const model = client.getGenerativeModel({
              model: modelName,
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 200,
                responseMimeType: 'application/json',
              },
            });

            const res = await model.generateContent(prompt);
            const text = res.response.text();
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.severity) {
                const sev = parsed.severity.toUpperCase() as MaintenanceSeverity;
                const mappedSeverity: MaintenanceSeverity =
                  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev) ? sev : ruleResult.severity;
                const mappedUrgency: 'HIGH' | 'MEDIUM' | 'LOW' =
                  mappedSeverity === 'CRITICAL' || mappedSeverity === 'HIGH' ? 'HIGH' : mappedSeverity === 'LOW' ? 'LOW' : 'MEDIUM';

                return {
                  severity: mappedSeverity,
                  urgency: mappedUrgency,
                  category: parsed.category || ruleResult.category,
                  reason: parsed.reason || ruleResult.reason,
                  source: 'GEMINI_AI',
                };
              }
            }
          } catch (modelErr: any) {
            console.warn(`[GeminiService.classify] Thử mô hình ${modelName} thất bại:`, modelErr.message);
            if (modelErr.message?.includes('429') || modelErr.message?.includes('Quota') || modelErr.message?.includes('Timeout')) {
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn('[GeminiService.classify] Chuyển sang Rule Engine:', err.message);
      }
    }

    return ruleResult;
  }

  /**
   * Phân loại sự cố dựa trên từ khóa ngữ cảnh KTX ICTU
   */
  private static classifyByRules(combined: string): MaintenanceClassificationResult {
    const lower = combined.toLowerCase();

    // 1. CRITICAL: Nguy cơ chập cháy điện, rò điện, nổ bình nóng lạnh, ngập nước vỡ ống chính
    const criticalWords = ['chập điện', 'rò điện', 'hở điện', 'giật điện', 'cháy', 'nổ', 'bốc khói', 'mùi khét', 'vỡ ống chính', 'bể ống', 'ngập nước', 'phát tia lửa', 'chập cháy'];
    if (criticalWords.some(w => lower.includes(w))) {
      let category = 'Điện & Quạt';
      let reason = 'Phát hiện nguy cơ chập cháy/rò điện nguy hiểm, cần can thiệp khẩn cấp';
      if (lower.includes('nước') || lower.includes('ống') || lower.includes('ngập')) {
        category = 'Cấp thoát nước';
        reason = 'Phát hiện nguy cơ vỡ đường ống nước chính hoặc ngập nước phòng';
      }
      return {
        severity: 'CRITICAL',
        urgency: 'HIGH',
        category,
        reason,
        source: 'RULE_ENGINE',
      };
    }

    // 2. HIGH: Mất điện toàn phòng, mất nước, hỏng khóa cửa phòng
    const highWords = ['mất điện toàn phòng', 'mất điện', 'mất nước', 'hỏng khóa', 'kẹt khóa', 'không vào được phòng', 'vỡ kính', 'không khóa được cửa', 'rơi cánh cửa'];
    if (highWords.some(w => lower.includes(w))) {
      let category = 'Cửa & Khóa';
      if (lower.includes('điện')) category = 'Điện & Quạt';
      if (lower.includes('nước')) category = 'Cấp thoát nước';
      return {
        severity: 'HIGH',
        urgency: 'HIGH',
        category,
        reason: 'Sự cố ảnh hưởng trực tiếp đến an ninh và sinh hoạt thiết yếu',
        source: 'RULE_ENGINE',
      };
    }

    // 3. MEDIUM: Quạt trần rung lắc, bóng đèn nhấp nháy, điều hòa không mát, tắc bồn rửa
    const medWords = ['rung lắc', 'nhấp nháy', 'bóng đèn', 'đèn', 'quạt', 'không mát', 'điều hòa', 'nóng lạnh', 'tắc bồn', 'tắc cống', 'thoát nước chậm', 'rò rỉ vòi', 'hỏng vòi'];
    if (medWords.some(w => lower.includes(w))) {
      let category = 'Điện & Quạt';
      if (lower.includes('nước') || lower.includes('bồn') || lower.includes('cống') || lower.includes('vòi')) category = 'Cấp thoát nước';
      return {
        severity: 'MEDIUM',
        urgency: 'MEDIUM',
        category,
        reason: 'Thiết bị tiện nghi phòng ở hoạt động kém, cần kiểm tra bảo dưỡng',
        source: 'RULE_ENGINE',
      };
    }

    // 4. LOW: Hỏng bản lề tủ, hỏng ngăn kéo, đứt dây phơi
    return {
      severity: 'LOW',
      urgency: 'LOW',
      category: lower.includes('cửa') || lower.includes('khóa') ? 'Cửa & Khóa' : 'Giường tủ',
      reason: 'Hao mòn trang thiết bị phụ trợ hoặc thẩm mỹ thông thường',
      source: 'RULE_ENGINE',
    };
  }
}
