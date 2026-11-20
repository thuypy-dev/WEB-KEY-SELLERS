import React, { useEffect, useState } from 'react';
import { Search, Eye, Users, ChevronLeft, ChevronRight, UserPlus, X, Shield, Mail, Lock, UserCheck, AlertCircle } from 'lucide-react';
import axiosClient from '../../../store/axiosClient';

// Format tiền
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

const ROLES = {
    ALL_STAFF: { value: 'ADMIN,SUPPORT', label: 'Tất cả nhân viên' },
    ADMIN: { value: 'ADMIN', label: 'Quản trị viên' },
    SUPPORT: { value: 'SUPPORT', label: 'Supporter' },
};

const StaffListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRole, setActiveRole] = useState(ROLES.ALL_STAFF.value);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPage: 1, total: 0 });
    
    // State Modal Chi tiết
    const [selectedUser, setSelectedUser] = useState(null);

    // State Modal Thêm Nhân Viên
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createForm, setCreateForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'SUPPORT',
    });

    // Fetch Data
    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/admin/users', {
                params: { 
                    page, 
                    limit: 10, 
                    search: searchTerm, 
                    role: activeRole,
                }
            });
            if (res && Array.isArray(res.data)) {
                setUsers(res.data);
                if (res.meta) setPagination({
                    page: Number(res.meta.page),
                    totalPage: Number(res.meta.totalPage),
                    total: Number(res.meta.total),
                    limit: Number(res.meta.limit)
                });
            }
        } catch (error) {
            console.error("Lỗi tải user:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when role or search term changes
    useEffect(() => { 
        fetchUsers(1); 
    }, [activeRole]);

    // Xem chi tiết
    const handleViewDetail = async (id) => {
        try {
            const res = await axiosClient.get(`/admin/users/${id}`);
            setSelectedUser(res);
        } catch (error) {
            alert("Lỗi tải chi tiết");
        }
    };

    // Thêm nhân viên
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setCreateError('');

        if (!createForm.fullName.trim() || !createForm.email.trim()) {
            setCreateError('Vui lòng nhập đầy đủ họ tên và email');
            return;
        }

        try {
            setCreateLoading(true);
            await axiosClient.post('/admin/users', {
                fullName: createForm.fullName.trim(),
                email: createForm.email.trim(),
                password: createForm.password || 'Staff@123456',
                role: createForm.role,
            });

            alert(`Tạo nhân viên thành công!\nMật khẩu đăng nhập: ${createForm.password || 'Staff@123456'}`);
            setShowCreateModal(false);
            setCreateForm({
                fullName: '',
                email: '',
                password: '',
                role: 'SUPPORT',
            });
            fetchUsers(1);
        } catch (error) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên';
            setCreateError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setCreateLoading(false);
        }
    };

    // Đổi vai trò trực tiếp
    const handleChangeRole = async (userId, currentRole) => {
        const nextRole = currentRole === 'ADMIN' ? 'SUPPORT' : 'ADMIN';
        const roleLabel = nextRole === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Supporter (SUPPORT)';
        if (!window.confirm(`Bạn có chắc muốn chuyển vai trò tài khoản này thành ${roleLabel}?`)) {
            return;
        }

        try {
            await axiosClient.patch(`/admin/users/${userId}`, { role: nextRole });
            alert('Cập nhật vai trò thành công!');
            fetchUsers(pagination.page);
        } catch (error) {
            alert('Lỗi cập nhật vai trò: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPage) {
            fetchUsers(newPage);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                        <Users className="text-vtv-green"/> Quản lý Nhân viên
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Tổng: {pagination.total} tài khoản nhân sự</p>
                </div>
                <button
                    onClick={() => {
                        setCreateError('');
                        setShowCreateModal(true);
                    }}
                    className="bg-vtv-green text-black font-bold px-4 py-2.5 rounded-xl hover:bg-green-400 transition flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95"
                >
                    <UserPlus size={18} /> Thêm nhân viên
                </button>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                {/* Role Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {Object.values(ROLES).map(r => (
                        <button 
                            key={r.value}
                            onClick={() => setActiveRole(r.value)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition whitespace-nowrap ${activeRole === r.value ? 'bg-vtv-green text-slate-950 shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-gray-300'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                {/* Search */}
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo email hoặc tên..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                        className="w-full bg-slate-950 border border-slate-700 text-gray-300 text-sm rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-vtv-green transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-950 text-gray-400 text-sm border-b border-slate-800">
                            <th className="p-4">Nhân sự</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Số dư ví</th>
                            <th className="p-4 text-center">Đơn hàng</th>
                            <th className="p-4">Ngày tham gia</th>
                            <th className="p-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
                                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{user.fullName || 'Chưa đặt tên'}</div>
                                                <div className="text-xs text-gray-400 font-mono">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                                            user.role === 'ADMIN' 
                                                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' 
                                                : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                                        }`}>
                                            <Shield size={12} />
                                            {user.role === 'ADMIN' ? 'Quản trị viên' : 'Supporter'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-vtv-green">{formatCurrency(user.balance)}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-xs text-gray-300">{user._count?.orders || 0}</span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400">{formatDate(user.createdAt)}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => handleChangeRole(user.id, user.role)} 
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-700"
                                            title="Đổi vai trò giữa Admin và Support"
                                        >
                                            Đổi quyền
                                        </button>
                                        <button 
                                            onClick={() => handleViewDetail(user.id)} 
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg transition"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Không tìm thấy nhân sự nào.</td></tr>
                        )}
                    </tbody>
                </table>
                {/* Thanh Phân Trang */}
                {pagination.totalPage > 1 && (
                    <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900">
                    <span className="text-sm text-gray-400">
                        Trang <span className="text-white font-bold">{pagination.page}</span> / {pagination.totalPage}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || loading} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition"><ChevronLeft size={20} /></button>
                        
                        <div className="flex gap-1">
                        {Array.from({ length: pagination.totalPage }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.totalPage || Math.abs(p - pagination.page) <= 2)
                            .map((pageNum, index, array) => {
                                const isGap = index > 0 && pageNum - array[index - 1] > 1;
                                return (
                                    <React.Fragment key={pageNum}>
                                    {isGap && <span className="px-2 text-gray-600">...</span>}
                                    <button 
                                        onClick={() => handlePageChange(pageNum)} 
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition ${pagination.page === pageNum ? 'bg-vtv-green text-black shadow-lg shadow-green-500/20' : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
                                    >
                                        {pageNum}
                                    </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPage || loading} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition"><ChevronRight size={20} /></button>
                    </div>
                    </div>
                )}
            </div>

            {/* --- MODAL THÊM NHÂN VIÊN MỚI --- */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                        <button 
                            onClick={() => setShowCreateModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X size={20}/>
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-vtv-green/20 text-vtv-green flex items-center justify-center border border-vtv-green/30">
                                <UserPlus size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold dark:text-white text-slate-900">Thêm nhân viên mới</h2>
                                <p className="text-xs text-gray-400">Cấp tài khoản nhân sự quản trị hệ thống</p>
                            </div>
                        </div>

                        {createError && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-start gap-2">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{createError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                                    Họ và tên <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-vtv-green outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                                    Email đăng nhập <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 text-gray-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="staff@vtvkey.com"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-white text-sm focus:border-vtv-green outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex justify-between">
                                    <span>Mật khẩu</span>
                                    <span className="text-gray-500 normal-case font-normal">(Mặc định: Staff@123456)</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Staff@123456"
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-white text-sm focus:border-vtv-green outline-none transition font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                                    Vai trò phân quyền
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                                        createForm.role === 'SUPPORT' 
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold' 
                                            : 'bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="SUPPORT"
                                            checked={createForm.role === 'SUPPORT'}
                                            onChange={() => setCreateForm({ ...createForm, role: 'SUPPORT' })}
                                            className="hidden"
                                        />
                                        <Shield size={16} />
                                        <span>Supporter</span>
                                    </label>

                                    <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                                        createForm.role === 'ADMIN' 
                                            ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold' 
                                            : 'bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="ADMIN"
                                            checked={createForm.role === 'ADMIN'}
                                            onChange={() => setCreateForm({ ...createForm, role: 'ADMIN' })}
                                            className="hidden"
                                        />
                                        <Shield size={16} />
                                        <span>Quản trị viên</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm font-semibold transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-5 py-2.5 rounded-xl bg-vtv-green hover:bg-green-400 text-black font-bold text-sm transition shadow-lg shadow-green-500/20 disabled:opacity-50"
                                >
                                    {createLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL CHI TIẾT USER --- */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"><X size={20}/></button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                {selectedUser.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedUser.fullName}</h2>
                                <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                                <div className="mt-1 flex gap-2">
                                    <span className="bg-vtv-green/20 text-vtv-green text-xs px-2 py-0.5 rounded border border-vtv-green/30">Số dư: {formatCurrency(selectedUser.balance)}</span>
                                    <span className="bg-slate-700 text-gray-300 text-xs px-2 py-0.5 rounded">ID: {selectedUser.id}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Lịch sử đơn hàng gần đây</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedUser.orders?.length > 0 ? (
                                selectedUser.orders.map(order => (
                                    <div key={order.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <div className="font-mono text-white text-sm font-bold">{order.code || `#${order.id}`}</div>
                                            <div className="text-xs text-gray-500">{formatDate(order.createdAt)} • {order._count?.items || 0} món</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-vtv-green font-bold text-sm">{formatCurrency(order.totalAmount)}</div>
                                            <div className={`text-[10px] uppercase font-bold mt-1 ${order.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'}`}>{order.status}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-600 py-4">Chưa có đơn hàng nào.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffListPage;
