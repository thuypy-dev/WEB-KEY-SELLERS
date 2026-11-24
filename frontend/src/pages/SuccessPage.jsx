import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Copy, Clock, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();

  // Đọc mã đơn hàng an toàn (xử lý cả trường hợp hash URL hoặc mã có dấu #)
  let rawCode = searchParams.get('orderCode');
  if (!rawCode && typeof window !== 'undefined' && window.location.hash) {
    // Trường hợp URL bị dính hash /success?orderCode=#ORD-xxx hoặc /success#ORD-xxx
    rawCode = window.location.hash.replace(/^#/, '');
    if (rawCode.includes('=')) {
      rawCode = rawCode.split('=')[1];
    }
  }
  const cleanOrderCode = decodeURIComponent(rawCode || '').replace(/^#/, '').trim();
  const orderCode = cleanOrderCode || 'ORD-UNKNOWN';

  // Lấy tổng tiền truyền sang nếu có
  const totalParam = searchParams.get('total');
  const amountNumber = totalParam ? Number(totalParam) : null;

  // Cấu hình thông tin ngân hàng (ưu tiên biến môi trường VITE_ hoặc mặc định thật)
  const BANK_ID = import.meta.env.VITE_BANK_ID || 'MB';
  const BANK_INFO = {
    bankName: import.meta.env.VITE_BANK_NAME || 'MB Bank (Quân Đội)',
    accountNum: import.meta.env.VITE_BANK_ACCOUNT_NO || '0788829507',
    accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || 'PHAN DUC THUY',
    amount: amountNumber
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountNumber)
      : 'Theo đơn hàng',
    content: `PDTKEY ${orderCode}`,
  };

  // Tạo link QR VietQR chuẩn NAPAS 24/7 (Tự động điền tiền, nội dung & tên chủ tài khoản)
  const qrUrl = amountNumber
    ? `https://img.vietqr.io/image/${BANK_ID}-${BANK_INFO.accountNum}-compact2.png?amount=${amountNumber}&addInfo=${encodeURIComponent(BANK_INFO.content)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
    : `https://img.vietqr.io/image/${BANK_ID}-${BANK_INFO.accountNum}-compact2.png?addInfo=${encodeURIComponent(BANK_INFO.content)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép: ' + text);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-vtv-card border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col md:flex-row"
      >
        {/* Hiệu ứng nền */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-vtv-green"></div>

        {/* CỘT TRÁI: THÔNG BÁO */}
        <div className="p-8 md:w-1/2 flex flex-col justify-center text-center md:text-left border-b md:border-b-0 md:border-r border-slate-700">
          <div className="mb-4 flex justify-center md:justify-start">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-vtv-green" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Mã đơn hàng:{' '}
            <span className="text-white font-mono font-bold">{orderCode}</span>
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock
                className="text-yellow-500 mt-0.5 flex-shrink-0"
                size={18}
              />
              <div>
                <h3 className="text-yellow-500 font-bold text-sm">
                  Đơn hàng đang chờ thanh toán
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên cạnh
                  để hệ thống xử lý.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <Link
              to="/orders"
              className="block w-full bg-slate-800 text-white font-bold py-3 text-center rounded-lg hover:bg-slate-700 transition border border-slate-600"
            >
              Xem trạng thái đơn hàng
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm py-2"
            >
              Tiếp tục mua sắm <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN THANH TOÁN */}
        <div className="p-8 md:w-1/2 bg-slate-900/50">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Smartphone size={18} className="text-vtv-green" /> Thông tin chuyển
            khoản
          </h3>

          {/* QR Code */}
          <div className="bg-white p-3 rounded-xl mb-6 shadow-inner mx-auto max-w-[200px]">
            <img
              src={qrUrl}
              alt="VietQR"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Chi tiết tài khoản */}
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-500 block text-xs">Ngân hàng</span>
                <span className="text-white font-bold">{BANK_INFO.bankName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Chủ tài khoản</span>
                <span className="text-white font-bold">{BANK_INFO.accountName}</span>
              </div>
            </div>

            {amountNumber && (
              <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
                <div>
                  <span className="text-gray-500 block text-xs">Số tiền cần chuyển</span>
                  <span className="text-vtv-green font-mono font-bold text-lg">{BANK_INFO.amount}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(String(amountNumber))}
                  className="text-vtv-green hover:bg-slate-700 p-1.5 rounded transition"
                  title="Sao chép số tiền"
                >
                  <Copy size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div>
                <span className="text-gray-500 block text-xs">
                  Số tài khoản
                </span>
                <span className="text-white font-mono font-bold text-lg">
                  {BANK_INFO.accountNum}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(BANK_INFO.accountNum)}
                className="text-vtv-green hover:bg-slate-700 p-1.5 rounded transition"
                title="Sao chép STK"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div>
                <span className="text-gray-500 block text-xs">
                  Nội dung chuyển khoản (Bắt buộc)
                </span>
                <span className="text-yellow-400 font-mono font-bold">
                  {BANK_INFO.content}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(BANK_INFO.content)}
                className="text-vtv-green hover:bg-slate-700 p-1.5 rounded transition"
              >
                <Copy size={16} />
              </button>
            </div>

            <p className="text-[10px] text-gray-500 text-center italic mt-4">
              * Hệ thống sẽ tự động duyệt đơn sau khi nhận được tiền * (thực ra
              là chờ Admin duyệt tay đó ).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
