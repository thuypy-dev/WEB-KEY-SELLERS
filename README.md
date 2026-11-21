# 🛒 PDT-KEY-SELLERS - Digital Asset E-Commerce & AI Assistant Platform

> **Nền tảng thương mại điện tử chuyên biệt cho sản phẩm số (License Keys, Accounts, Game Cards) tích hợp trợ lý AI RAG tư vấn thông minh và cơ chế kho khóa giữ chỗ chống xung đột.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind-61DAFB?logo=react&logoColor=black)
![Backend](https://img.shields.io/badge/Backend-NestJS_%7C_Prisma_%7C_MySQL-E0234E?logo=nestjs&logoColor=white)
![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_%7C_ChromaDB_RAG-FFD43B?logo=google&logoColor=black)
![Security](https://img.shields.io/badge/Security-AES--256_Encryption-green)
![Docker](https://img.shields.io/badge/Deployment-Docker_Compose_%7C_Nginx-2496ED?logo=docker&logoColor=white)

---

## 📖 1. Giới Thiệu Dự Án (Project Overview)

**PDT-KEY-SELLERS** (WEBKey) không chỉ là một website bán hàng thông thường mà là giải pháp công nghệ toàn diện giải quyết các bài toán kỹ thuật đặc thù trong giao dịch **Tài sản số (Digital Assets)** như: Key phần mềm bản quyền (Windows, Office, Diệt virus BKAV/Kaspersky), Tài khoản dịch vụ số (Netflix, Spotify, Youtube Premium), Key Game bản quyền (Steam, Valorant, Riot)...

Hệ thống tích hợp **Trợ lý ảo Fairy** sử dụng công nghệ RAG (Retrieval-Augmented Generation) kết hợp Google Gemini để tư vấn khách hàng theo thời gian thực và **Hệ thống gợi ý sản phẩm cá nhân hóa** (Recommendation System) thúc đẩy doanh số bán chéo (Cross-sell).

---

## 🎯 2. Mục Đích & Bài Toán Cốt Lõi (Core Problems Solved)

Dự án tập trung giải quyết 4 bài toán kỹ thuật hóc búa của thương mại điện tử tài sản số:

### 1. Chống Xung Đột Kho & Đua Mua (Concurrency & Race Condition Control) 🔒
* **Vấn đề:** Nhiều khách hàng cùng bấm mua 1 sản phẩm tại cùng một giây, dẫn đến nguy cơ bán trùng 1 key cho nhiều người.
* **Giải pháp:** Cơ chế **Stock Reservation (Khóa giữ chỗ thông minh)** kết hợp **Database Transaction** (`prisma.$transaction`). Khi khách đặt đơn, key lập tức được chuyển từ `AVAILABLE` sang `LOCKED`. Nếu thanh toán thành công chuyển thành `SOLD`; nếu đơn hủy hoặc quá hạn, key tự động được hoàn về `AVAILABLE`.

### 2. Bảo Mật Dữ Liệu Bản Quyền Tuyệt Đối (Digital Asset Security) 🛡️
* **Vấn đề:** Mã kích hoạt bản quyền và tài khoản số là tài sản vô hình, nếu lưu trữ văn bản thô (plaintext) sẽ dễ bị rò rỉ nếu database bị xâm nhập.
* **Giải pháp:** Áp dụng mã hóa 2 chiều **AES-256-CBC** (`EncryptionService`) với Secret Key an toàn. Dữ liệu chỉ được giải mã và trả về cho khách hàng khi đơn hàng đạt trạng thái hoàn thành (`COMPLETED`).

### 3. Phân Quyền Vận Hành Doanh Nghiệp (Multi-tier RBAC) 👥
* **Vấn đề:** Nhân viên hỗ trợ không nên có quyền can thiệp vào kho hàng, chỉnh sửa giá hay cấu hình hệ thống.
* **Giải pháp:** Hệ thống RBAC 3 cấp chặt chẽ:
  * **ADMIN:** Toàn quyền quản trị hệ thống, nhân sự, doanh thu, cài đặt nâng cao.
  * **STAFF:** Quản lý kho key, xử lý đơn hàng, quản lý sản phẩm và danh mục.
  * **SUPPORT:** Chăm sóc khách hàng, tra cứu trạng thái đơn hàng của khách, quản lý và phản hồi đánh giá.

### 4. Ứng Dụng AI Thế Hệ Mới (Next-Gen AI Integration) 🧠
* **Chatbot RAG (Trợ lý Fairy):**
  * Tích hợp **Google Gemini** với cơ sở dữ liệu Vector **ChromaDB**.
  * Tra cứu ngữ nghĩa từ tài liệu chính sách của cửa hàng để trả lời chính xác, loại bỏ hiện tượng "ảo giác" (Hallucination) của AI.
* **Hệ thống Gợi ý (Recommendation Engine):**
  * Ghi nhận và chấm điểm hành vi người dùng (Xem sản phẩm: +1, Thêm giỏ hàng: +5, Mua hàng: +10).
  * Ứng dụng thuật toán **Collaborative Filtering** để đề xuất thông minh các sản phẩm liên quan.

---

## 🏗️ 3. Mô Hình Kho Hàng 3 Tầng (3-Tier Inventory Model)

Database được tổ chức thành 3 tầng phân cấp rõ ràng theo chuẩn TMĐT số:

```
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 1: KỆ TRƯNG BÀY (Product)                              │
│ Đại diện cho sản phẩm tổng thể (Tên, Ảnh, Mô tả, Danh mục)   │
│ Ví dụ: "Phần mềm Diệt Virus BKAV Pro"                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1 - N
┌──────────────────────────────▼──────────────────────────────┐
│ TẦNG 2: BẢNG GIÁ & GÓI DỊCH VỤ (ProductVariant)             │
│ Các gói / thời hạn cụ thể kèm giá bán và giá gốc           │
│ Ví dụ: "Gói 1 Năm", "Gói 2 Năm", "Gói Vĩnh Viễn"            │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1 - N
┌──────────────────────────────▼──────────────────────────────┐
│ TẦNG 3: KHO CHỨA KEY THẬT (StockItem)                       │
│ Chứa từng Key / Credential cụ thể đã mã hóa AES-256          │
│ Trạng thái: AVAILABLE ➔ LOCKED ➔ SOLD                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 4. Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Giao diện người dùng & Admin Dashboard)
* **React 18**: Thư viện xây dựng giao diện người dùng tương tác cao.
* **Vite**: Build tool thế hệ mới, tối ưu tốc độ phát triển và nạp module cực nhanh.
* **Tailwind CSS**: Utility-first CSS framework giúp thiết kế giao diện Dark Mode hiện đại, nhất quán.
* **Zustand**: Thư viện quản lý state toàn cục nhẹ và hiệu quả (Auth, Theme, Cart).
* **Lucide React**: Bộ icon hiện đại, chuẩn hóa giao diện.
* **Axios**: HTTP Client với Interceptor tự động làm mới JWT token và xử lý lỗi tập trung.

### Backend (Hệ thống xử lý & API)
* **NestJS**: Framework Node.js kiến trúc module hướng dịch vụ (Service-Oriented), dễ mở rộng và bảo trì.
* **Prisma ORM**: Type-safe ORM thao tác cơ sở dữ liệu an toàn, hạn chế lỗi cú pháp query.
* **MySQL 8.0**: Cơ sở dữ liệu quan hệ đảm bảo tính toàn vẹn dữ liệu (ACID).
* **Redis**: Bộ nhớ đệm (Caching) tối ưu tốc độ đọc và xử lý phiên làm việc.
* **JWT & Cookie HTTPOnly**: Cơ chế xác thực an toàn, chống tấn công XSS và CSRF.
* **Cloudinary**: Lưu trữ và tối ưu hóa hình ảnh sản phẩm trên CDN toàn cầu.
* **VietQR**: Tạo mã QR thanh toán động chính xác theo số tiền và nội dung đơn hàng.

### AI System (Hệ thống thông minh)
* **Ngôn ngữ:** Python 3.10+.
* **LLM:** Google Gemini API (`gemini-flash-lite-latest`, `gemini-3.8-flash`).
* **Vector Database:** ChromaDB (Lưu trữ và truy vấn vector ngữ nghĩa tài liệu cửa hàng).
* **Technique:** RAG (Retrieval-Augmented Generation) & Collaborative Filtering.

### DevOps & Triển Khai
* **Docker & Docker Compose**: Đóng gói toàn bộ các dịch vụ (`key_frontend`, `key_backend`, `key_mysql`, `key_redis`) trong container độc lập.
* **Nginx**: Reverse Proxy định tuyến traffic và cấu hình chứng chỉ bảo mật SSL HTTPS.
* **CI/CD Pipeline**: GitHub Actions tự động kiểm thử, build và deploy lên NUC Server khi có commit mới vào nhánh `main`.

---

## 📂 5. Cấu Trúc Dự Án (Project Structure)

```bash
WEB-KEY-SELLERS/
├── .github/workflows/          # Kịch bản CI/CD tự động deploy lên server NUC
├── AI_SYSTEM/                  # Dịch vụ Python cho RAG Vector Search & Chatbot
│   ├── src/database/           # Models & kết nối CSDL của AI
│   └── src/services/           # Logic RAG, Intent Classification, Recommendation
├── frontend/                   # Ứng dụng ReactJS (Client Store & Quản trị Admin)
│   ├── src/admin/              # Giao diện quản trị (Sản phẩm, Kho key, Đơn hàng, Nhân viên)
│   ├── src/components/         # Components giao diện (Header, Footer, AI Chatbot Fairy)
│   ├── src/pages/              # Các trang giao diện cửa hàng (Home, Catalog, Checkout, Orders)
│   └── src/store/              # State management toàn cục (Auth, Cart, Theme)
├── prisma/                     # Prisma Schema, Database Migrations & Seed data
├── src/                        # Mã nguồn Backend NestJS
│   ├── admin/                  # Nghiệp vụ quản trị: Quản lý sản phẩm, kho key, duyệt đơn
│   ├── auth/                   # Nghiệp vụ xác thực: Đăng nhập, Đăng ký, Google OAuth
│   └── storefront/             # Nghiệp vụ cửa hàng: Khám phá sản phẩm, Đặt hàng, AI Chat
├── docker-compose.yml          # Cấu hình container hóa các dịch vụ
└── README.md
```

---

## 🚀 6. Hướng Dẫn Khởi Chạy (Getting Started)

### Yêu cầu tiên quyết:
- **Node.js** >= 18.x
- **Docker & Docker Compose**
- **Git**

### Khởi chạy nhanh bằng Docker:

```bash
# 1. Clone repository
git clone https://github.com/thuypy-dev/WEB-KEY-SELLERS.git
cd WEB-KEY-SELLERS

# 2. Cấu hình biến môi trường
cp .env.example .env

# 3. Khởi chạy toàn bộ hệ thống
docker compose up -d --build
```

Sau khi khởi chạy thành công:
- **Cửa hàng & Trang quản trị**: `http://localhost:5173` (Production: `https://pdtkey-sellers.store`)
- **Backend API**: `http://localhost:3000`
- **Swagger API Docs**: `http://localhost:3000/api`

---

## 📄 License
Phát hành theo giấy phép [MIT License](LICENSE).
