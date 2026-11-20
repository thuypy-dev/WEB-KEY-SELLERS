#!/usr/bin/env bash
set -e

echo "========================================================"
echo "   TRIỂN KHAI WEB KEY SELLERS LÊN NUCSERVER"
echo "========================================================"

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt trên server. Vui lòng cài đặt docker."
    exit 1
fi

# Kiểm tra lệnh compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Không tìm thấy 'docker compose' hoặc 'docker-compose'."
    exit 1
fi

# Kiểm tra file .env
if [ ! -f .env ]; then
    echo "📝 Khởi tạo file .env từ .env.example..."
    cp .env.example .env
fi

echo "📦 Đang build và khởi động hệ thống với $COMPOSE_CMD..."
$COMPOSE_CMD up -d --build --remove-orphans

echo "⏳ Đang đồng bộ cấu trúc database Prisma..."
# Chờ container backend sẵn sàng rồi sync schema
sleep 5
$COMPOSE_CMD exec -T key-backend npx prisma db push || true

echo ""
echo "========================================================"
echo "✅ Dịch vụ Web Key Sellers đã sẵn sàng!"
echo "👉 Frontend Web: http://192.168.1.14:3003"
echo "👉 Backend API:  http://192.168.1.14:611"
echo "📊 Xem tiến trình: $COMPOSE_CMD ps"
echo "📜 Xem logs: $COMPOSE_CMD logs -f"
echo "========================================================"
