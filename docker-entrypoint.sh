#!/bin/sh
set -e

echo "=========================================="
echo "🚀 KHỞI ĐỘNG PDTKEY BACKEND..."
echo "=========================================="

echo "⏳ Đang đồng bộ cấu trúc database Prisma..."
npx prisma db push --skip-generate || true

echo "🌱 Tự động nạp dữ liệu mẫu (Sản phẩm, Admin, Nhân viên)..."
npm run seed || true
npm run seed:admin || true
npm run seed:staff || true

echo "✅ Database đã sẵn sàng! Đang khởi chạy ứng dụng..."
exec node dist/main
