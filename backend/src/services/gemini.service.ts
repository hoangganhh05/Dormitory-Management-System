import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ENV } from '../config/env';

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
- Loại phòng Tiêu chuẩn (Standard): Sức chứa tối đa 4 sinh viên/phòng (4 giường đơn G1, G2, G3, G4). Đơn giá lưu trú: 450.000 VNĐ / sinh viên / tháng (chưa bao gồm chỉ số điện, nước).
- Loại phòng VIP: Sức chứa tối đa 2 sinh viên/phòng (2 giường G1, G2), trang bị điều hòa nhiệt độ Inverter, bình nóng lạnh riêng. Đơn giá lưu trú: 950.000 VNĐ / sinh viên / tháng.

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
Bạn là "Trợ lý AI Ký túc xá" thông minh và tận tâm của Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU).
Nhiệm vụ của bạn là giải đáp mọi thắc mắc của sinh viên và cán bộ về nội quy ký túc xá, quy định giờ giấc, phân khu phòng ở, thủ tục đăng ký, quy trình báo hỏng cơ sở vật chất và an toàn PCCC.

NGUYÊN TẮC BẮT BUỘC:
1. Luôn chào hỏi lễ phép, xưng là "Trợ lý KTX ICTU" hoặc "mình" và gọi người dùng là "bạn" hoặc "sinh viên".
2. Chỉ trả lời dựa trên tri thức thực tế của KTX ICTU được cung cấp bên dưới. Không tự bịa đặt số liệu hay nội quy không có trong quy chế.
3. Nếu người dùng hỏi các vấn đề không thuộc phạm vi KTX (như làm bài tập lập trình, hỏi chuyện bên ngoài), hãy lịch sự từ chối và hướng họ quay lại các chủ đề liên quan đến Ký túc xá ICTU.
4. AI tuyệt đối KHÔNG tự ý đưa ra các quyết định hành chính (như tự ý duyệt đơn cho ở, tự ý đổi phòng hay miễn giảm lệ phí) mà phải hướng dẫn sinh viên nộp đơn online hoặc liên hệ trực tiếp Ban Quản lý tại Văn phòng Tầng 1 Tòa A.
5. Cung cấp câu trả lời ngắn gọn, rõ ràng, gạch đầu dòng dễ nhìn, chuyên nghiệp.

TRI THỨC KTX THAM CHIẾU:
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
        recommendedModel: 'gemini-1.5-flash',
      },
    };
  }

  /**
   * Sinh câu trả lời từ Gemini hoặc Fallback Knowledge Base với hỗ trợ Multi-turn Context
   */
  static async askAI(userPrompt: string, history?: ChatHistoryItem[]): Promise<AIResponse> {
    const client = this.getClient();
    const promptTrimmed = userPrompt?.trim() || '';

    if (!promptTrimmed) {
      return {
        answer: 'Xin chào! Mình là Trợ lý AI Ký túc xá ICTU. Bạn cần hỗ trợ thông tin gì về nội quy, giờ giấc, phòng ở hay thủ tục đăng ký KTX hôm nay?',
        source: 'KNOWLEDGE_BASE_FALLBACK',
        modelUsed: 'system-default',
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Nếu đã cấu hình khóa Gemini API hợp lệ
    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: ENV.GEMINI_MODEL,
          systemInstruction: this.SYSTEM_INSTRUCTION,
          generationConfig: {
            temperature: 0.3, // Nhiệt độ thấp để giảm tối đa ảo giác (hallucination), tăng tính chính xác
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

        let responseText = '';

        // Nếu có lịch sử trò chuyện, sử dụng chat session (Multi-turn)
        if (history && Array.isArray(history) && history.length > 0) {
          const formattedHistory = history
            .filter(item => item.content && item.content.trim().length > 0)
            .slice(-6) // Giữ tối đa 6 lượt tin nhắn gần nhất để tiết kiệm token và giữ trọng tâm
            .map(item => ({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.content }],
            }));

          const chat = model.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(promptTrimmed);
          responseText = result.response.text();
        } else {
          const result = await model.generateContent(promptTrimmed);
          responseText = result.response.text();
        }

        return {
          answer: responseText,
          source: 'GEMINI_LIVE',
          modelUsed: ENV.GEMINI_MODEL,
          isAiGenerated: true,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.warn('[GeminiService API Error -> Chuyển sang Fallback Engine]:', error.message);
        // Tự động chuyển tiếp mượt mà sang Fallback nếu lỗi kết nối / hết quota
      }
    }

    // Fallback Engine thông minh dựa trên bộ từ khóa quy chế KTX
    return this.generateFallbackAnswer(promptTrimmed);
  }

  /**
   * Cơ chế trả lời thông minh dự phòng (Rule-based Fallback Engine)
   */
  private static generateFallbackAnswer(query: string): AIResponse {
    const q = query.toLowerCase();

    let answer = '';

    // Helper khớp nhiều từ khóa (hỗ trợ cả tiếng Việt có dấu và không dấu)
    const hasKeyword = (...keywords: string[]) => keywords.some(k => q.includes(k));

    if (hasKeyword('giờ', 'gio', 'mở cửa', 'mo cua', 'đóng cửa', 'dong cua', 'giới nghiêm', 'gioi nghiem', 'về muộn', 've muon')) {
      answer = `🕒 **Quy định giờ giấc ra vào Ký túc xá ICTU:**
- **Giờ mở cửa:** 05h30 sáng hàng ngày.
- **Giờ đóng cửa (giới nghiêm):** 23h00 đêm hàng ngày.
- **Về muộn:** Nếu có việc học tập nghiên cứu đột xuất về sau 23h00, bạn cần xuất trình thẻ sinh viên và ký xác nhận vào sổ trực của cán bộ thường trực KTX.`;
    } else if (hasKeyword('giá', 'gia', 'tiền', 'tien', 'chi phí', 'chi phi', 'phí', 'phi', 'bao nhiêu', 'bao nhieu', '450', '950', 'vnd', 'vne')) {
      answer = `💰 **Biểu phí lưu trú Ký túc xá ICTU:**
- **Phòng Tiêu chuẩn (Standard - 4 người):** 450.000 VNĐ / sinh viên / tháng (4 người/phòng, giường tầng cá nhân).
- **Phòng VIP (2 người):** 950.000 VNĐ / sinh viên / tháng (được trang bị điều hòa Inverter và bình nước nóng riêng).
- *Lưu ý:* Tiền điện và nước sinh hoạt sẽ tính riêng theo chỉ số đồng hồ thực tế hàng tháng của từng phòng.`;
    } else if (hasKeyword('nữ', 'nu', 'tòa', 'toa', 'khu', 'block')) {
      answer = `🏢 **Phân khu lưu trú theo giới tính tại KTX:**
- **Tòa A:** Dành riêng cho sinh viên Nam.
- **Tòa B:** Dành riêng cho sinh viên Nữ.
- Quy tắc KTX nghiêm cấm sinh viên Nam sang khu Tòa B và ngược lại sau giờ sinh hoạt chung. Tuyệt đối không dẫn người khác giới ở lại qua đêm.`;
    } else if (hasKeyword('sửa', 'sua', 'hỏng', 'hong', 'báo hỏng', 'bao hong', 'bóng đèn', 'bong den', 'quạt', 'quat', 'nước', 'nuoc', 'điện', 'dien', 'khóa', 'khoa', 'maintenance', 'repair')) {
      answer = `🛠️ **Quy trình báo hỏng và sửa chữa thiết bị:**
1. Đăng nhập vào hệ thống và chọn mục **"Báo hỏng thiết bị"** trên thanh menu.
2. Nhập số phòng của bạn, chọn loại sự cố (Điện, Nước, Khóa cửa...) và chọn mức độ khẩn cấp.
3. Đội kỹ thuật KTX sẽ tiếp nhận phiếu và cử kỹ thuật viên đến khắc phục trong vòng 24 giờ làm việc.`;
    } else if (hasKeyword('đăng ký', 'dang ky', 'xin ở', 'xin o', 'hồ sơ', 'ho so', 'thủ tục', 'thu tuc', 'nộp đơn', 'nop don', 'register', 'checkin', 'check-in')) {
      answer = `📝 **Quy trình nộp đơn đăng ký lưu trú KTX online:**
1. Truy cập mục **"Đăng ký lưu trú"** trên cổng thông tin KTX.
2. Chọn phòng và học kỳ mong muốn.
3. Ban Quản lý sẽ xét duyệt trong 24-48 giờ và phân vị trí giường trống tự động cho bạn.`;
    } else if (hasKeyword('nấu ăn', 'nau an', 'cháy', 'chay', 'bếp', 'bep', 'pccc', 'an toàn', 'an toan', 'phòng cháy', 'phong chay', 'fire', 'safety')) {
      answer = `🔥 **Nội quy an toàn PCCC KTX ICTU:**
- Nghiêm cấm tuyệt đối việc đun nấu bằng bếp điện, bếp gas, bếp từ trong phòng ngủ.
- Không sử dụng các thiết bị sinh nhiệt công suất lớn dễ gây chập điện.
- Tắt toàn bộ điện quạt trước khi rời khỏi phòng.`;
    } else if (hasKeyword('liên hệ', 'lien he', 'số điện thoại', 'so dien thoai', 'hotline', 'cán bộ', 'can bo', 'bql', 'ban quản lý', 'van phong', 'contact', 'email')) {
      answer = `📞 **Thông tin liên hệ Ban Quản lý KTX ICTU:**
- **Văn phòng BQL:** Tầng 1, Tòa A Ký túc xá ICTU.
- **Hotline trực ban 24/7:** 0985.333.555.
- **Email:** bqlktx@ictu.edu.vn.`;
    } else {
      answer = `Dạ chào bạn! Mình là **Trợ lý AI Ký túc xá ICTU**. Mình có thể hỗ trợ bạn giải đáp các vấn đề sau:
- 🕒 **Giờ giấc mở/đóng cửa & quy định tạm trú**
- 💰 **Đơn giá phòng Standard (450k) và phòng VIP (950k)**
- 🏢 **Phân khu Tòa A (Nam) và Tòa B (Nữ)**
- 🛠️ **Hướng dẫn báo hỏng cơ sở vật chất**
- 📝 **Quy trình nộp hồ sơ xin ở KTX online**
- 🔥 **Quy chế an toàn PCCC & an ninh trật tự**

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
}
