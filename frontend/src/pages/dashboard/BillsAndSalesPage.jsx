import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import BillPreviewModal from './BillPreviewModal';
import {
    TrendingUp, FileText, CreditCard, Wallet, DollarSign,
    Smartphone, Calendar, Trash2, Loader2, RefreshCw,
    BarChart3, PieChart, Hash, Eye, XCircle, Package, User, Clock, CheckCircle2
} from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const PAYMENT_ICONS = {
    CASH: { icon: <Wallet size={22} />, color: '#10b981', bg: '#d1fae5' },
    UPI: { icon: <Smartphone size={22} />, color: '#8b5cf6', bg: '#ede9fe' },
    CARD: { icon: <CreditCard size={22} />, color: '#ef4444', bg: '#fee2e2' },
    ONLINE: { icon: <DollarSign size={22} />, color: '#06b6d4', bg: '#cffafe' },
};

const BillsAndSalesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [salesData, setSalesData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const [startDateCust, setStartDateCust] = useState('');
    const [endDateCust, setEndDateCust] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [printingBillId, setPrintingBillId] = useState(null);

    const formatLocalDate = (date) => {
        const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getDateRange = (days) => {
        const end = new Date(), start = new Date();
        if (days === '0') { start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); }
        else { start.setDate(start.getDate() - parseInt(days)); start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); }
        return { startDate: start, endDate: end };
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };
            
            let start, end;
            if (startDateCust && endDateCust) {
                start = startDateCust;
                end = endDateCust;
            } else {
                const range = getDateRange(dateRange);
                start = formatLocalDate(range.startDate);
                end = formatLocalDate(range.endDate);
            }

            const q = `?startDate=${start}&endDate=${end}${searchTerm ? `&search=${searchTerm}` : ''}`;
            const [dailyRes, weeklyRes, billsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/reports/daily${q}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/weekly${q}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/bills${q}`, { headers })
            ]);
            const [dD, wD, bD] = await Promise.all([dailyRes.json(), weeklyRes.json(), billsRes.json()]);
            if (dD.success) setSalesData(dD.data);
            if (wD.success) setChartData(wD.data);
            if (bD.success) setAllBills(bD.data);
        } catch (err) { console.error("Failed to fetch report data", err); }
        finally { setLoading(false); }
    }, [dateRange, startDateCust, endDateCust, searchTerm]);

    const fetchBillDetail = async (id) => {
        setFetchingDetail(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${id}`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            const data = await res.json();
            if (data.success) {
                setSelectedBill(data.data);
                setShowDetail(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingDetail(false);
        }
    };

    const handleDeleteBill = async (id) => {
        if (!window.confirm("Cancel this bill? Stock will be reverted.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bills/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchData(); else alert(result.error);
        } catch { alert("Failed to delete bill"); }
    };

    useEffect(() => {
        const state = location.state;
        if (state) {
            if (state.date) {
                setStartDateCust(state.date);
                setEndDateCust(state.date);
            }
            if (state.search) {
                setSearchTerm(state.search);
            }
            if (state.billId) {
                fetchBillDetail(state.billId);
            }
        }
    }, [location.state]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const getPaymentAmount = (mode) => {
        if (!salesData?.paymentSummary) return 0;
        return salesData.paymentSummary.find(p => p.mode?.toUpperCase() === mode?.toUpperCase())?.amount || 0;
    };

    const paymentModeData = salesData?.paymentSummary ? {
        labels: salesData.paymentSummary.map(p => p.mode),
        datasets: [{
            data: salesData.paymentSummary.map(p => p.amount),
            backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(139,92,246,0.8)', 'rgba(239,68,68,0.8)', 'rgba(6,182,212,0.8)', 'rgba(245,158,11,0.8)'],
            borderColor: ['#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b'],
            borderWidth: 2
        }]
    } : null;

    const dailySalesChart = chartData?.dailyBreakdown ? {
        labels: chartData.dailyBreakdown.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Daily Revenue (₹)',
            data: chartData.dailyBreakdown.map(d => d.totalSales),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.08)',
            tension: 0.4, fill: true, pointBackgroundColor: '#6366f1', pointRadius: 5
        }]
    } : null;

    const chartOptions = {
        responsive: true, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold' }, color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } } }
    };
    const pieOptions = { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' }, padding: 16 } } } };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="master-content-layout fade-in">
                    {/* Header */}
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Revenue Intelligence</span>
                            </div>
                            <h2>Bills & Sales</h2>
                            <p>Period-based revenue breakdown, payment analysis, and complete bill register.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                                value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="0">Today</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="60">Last 60 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                            <button onClick={fetchData} className="btn-premium-outline !py-2.5 !px-4 flex items-center gap-2">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Live</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-slate-100">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={56} />
                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Compiling Revenue Intelligence...</p>
                        </div>
                    ) : (<>
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { label: 'Total Revenue', val: `₹${salesData?.totalSales?.toLocaleString('en-IN') || '0'}`, icon: <TrendingUp size={20} />, c: '#6366f1', bg: '#e0e7ff' },
                                { label: 'Total Bills', val: salesData?.totalBills || '0', icon: <Hash size={20} />, c: '#0ea5e9', bg: '#e0f2fe' },
                                { label: 'Cash', val: `₹${getPaymentAmount('CASH').toLocaleString('en-IN')}`, icon: <Wallet size={20} />, c: '#10b981', bg: '#d1fae5' },
                                { label: 'UPI', val: `₹${getPaymentAmount('UPI').toLocaleString('en-IN')}`, icon: <Smartphone size={20} />, c: '#8b5cf6', bg: '#ede9fe' },
                                { label: 'Card', val: `₹${getPaymentAmount('CARD').toLocaleString('en-IN')}`, icon: <CreditCard size={20} />, c: '#ef4444', bg: '#fee2e2' },
                                { label: 'Online', val: `₹${getPaymentAmount('ONLINE').toLocaleString('en-IN')}`, icon: <DollarSign size={20} />, c: '#06b6d4', bg: '#cffafe' },
                            ].map(({ label, val, icon, c, bg }) => (
                                <div key={label} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] transition-all">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg, color: c }}>{icon}</div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter">{val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
                                <div className="flex items-center gap-3 mb-8">
                                    <Calendar size={18} className="text-indigo-600" />
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Daily Revenue Trend</h3>
                                </div>
                                <div style={{ height: '280px' }}>
                                    {dailySalesChart ? <Line data={dailySalesChart} options={{ ...chartOptions, maintainAspectRatio: false }} /> : (
                                        <div className="flex items-center justify-center h-full text-slate-300">
                                            <BarChart3 size={48} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
                                <div className="flex items-center gap-3 mb-8">
                                    <PieChart size={18} className="text-indigo-600" />
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Payment Mix</h3>
                                </div>
                                <div style={{ height: '280px' }}>
                                    {paymentModeData ? <Pie data={paymentModeData} options={{ ...pieOptions, maintainAspectRatio: false }} /> : (
                                        <div className="flex items-center justify-center h-full text-slate-300">
                                            <PieChart size={48} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary Table */}
                        {salesData?.paymentSummary && salesData.paymentSummary.length > 0 && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                                <div className="flex items-center gap-3 px-10 py-7 border-b border-slate-50">
                                    <Wallet size={18} className="text-indigo-600" />
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Payment Mode Analysis</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {salesData.paymentSummary.map((p, i) => {
                                        const pct = ((p.amount / salesData.totalSales) * 100).toFixed(1);
                                        const cfg = PAYMENT_ICONS[p.mode?.toUpperCase()] || { icon: <DollarSign size={20} />, color: '#6366f1', bg: '#e0e7ff' };
                                        return (
                                            <div key={i} className="flex items-center gap-6 px-10 py-5">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-black text-slate-700 uppercase tracking-tight text-sm">{p.mode}</span>
                                                        <span className="font-black text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cfg.color }}></div>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-slate-400 w-14 text-right">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Bills Table */}
                        <div className="table-container-premium">
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-indigo-600" />
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Bill Register</h3>
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full">{allBills.length}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="table-premium">
                                  <thead>
                                      <tr>
                                          <th>#</th>
                                          <th>Bill No.</th>
                                          <th>Date & Time</th>
                                          <th>Items Ordered</th>
                                          <th>Qty</th>
                                          <th className="text-right">Grand Total</th>
                                          <th className="text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {allBills.length === 0 ? (
                                          <tr><td colSpan="7" style={{ textAlign: 'center', padding: '80px 0' }}>
                                              <FileText size={56} className="text-slate-100 mx-auto mb-4" />
                                              <p className="font-bold text-slate-400">No bills found for selected period.</p>
                                          </td></tr>
                                      ) : allBills.map((bill, index) => {
                                          const items = bill.items?.map(i => `${i.name}(${i.quantity})`).join(', ') || '—';
                                          const qty = bill.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                                          return (
                                              <tr key={bill._id} className="group cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => fetchBillDetail(bill._id)}>
                                                  <td className="text-slate-400 font-bold">{index + 1}</td>
                                                  <td>
                                                      <span className="font-black text-slate-800">{bill.bill_number}</span>
                                                  </td>
                                                  <td>
                                                      <div className="flex items-center gap-2">
                                                          <Calendar size={14} className="text-slate-300" />
                                                          <span className="text-sm font-bold text-slate-600">
                                                              {new Date(bill.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                          </span>
                                                      </div>
                                                  </td>
                                                  <td>
                                                      <span className="text-xs font-bold text-slate-500 max-w-xs truncate block" title={items}>{items}</span>
                                                  </td>
                                                  <td>
                                                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-slate-600">{qty}</span>
                                                  </td>
                                                  <td className="text-right">
                                                      <span className="font-black text-slate-900 text-base">₹{(bill.grand_total || 0).toLocaleString('en-IN')}</span>
                                                  </td>
                                                  <td className="text-right">
                                                      <div className="flex justify-end gap-2">
                                                          <button onClick={(e) => { e.stopPropagation(); fetchBillDetail(bill._id); }} className="action-icon-btn edit" title="View Bill">
                                                              <Eye size={16} />
                                                          </button>
                                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill._id); }} className="action-icon-btn delete" title="Cancel Bill">
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </div>
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                            </div>
                        </div>
                    </>)}
                </div>

                {/* Bill Detail Drawer */}
                {showDetail && selectedBill && (
                    <>
                        <div className="pi-drawer-overlay" onClick={() => setShowDetail(false)}></div>
                        <div className="pi-drawer animate-in slide-in-from-right duration-300">
                            <div className="pi-drawer-header">
                                <div>
                                    <p className="pi-drawer-subtitle">Retail Sale Invoice</p>
                                    <h3 className="pi-drawer-title">{selectedBill.bill_number}</h3>
                                </div>
                                <button onClick={() => setShowDetail(false)} className="pi-drawer-close">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="pi-drawer-body">
                                <div className="pi-detail-grid">
                                    <div className="pi-detail-card">
                                        <label>Date & Time</label>
                                        <p>{new Date(selectedBill.createdAt).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="pi-detail-card">
                                        <label>Customer</label>
                                        <p>{selectedBill.customer_name || 'Walk-in Customer'}</p>
                                    </div>
                                    <div className="pi-detail-card">
                                        <label>Table / Mode</label>
                                        <p>{selectedBill.table_no ? `Table ${selectedBill.table_no}` : selectedBill.type}</p>
                                    </div>
                                </div>

                                <div className="pi-items-section">
                                    <div className="pi-section-title">
                                        <Package size={16} /> Ordered Items
                                    </div>
                                    <div className="pi-items-table-wrap">
                                        <table className="pi-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Rate</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedBill.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name}</td>
                                                        <td className="font-bold">{item.quantity}</td>
                                                        <td>₹{item.unit_price?.toLocaleString('en-IN')}</td>
                                                        <td style={{ textAlign: 'right' }} className="font-bold">₹{item.total_price?.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="pi-summary-calc">
                                    <div className="pi-calc-row">
                                        <span>Subtotal</span>
                                        <span>₹{selectedBill.sub_total?.toLocaleString('en-IN')}</span>
                                    </div>
                                    {selectedBill.tax_amount > 0 && (
                                        <div className="pi-calc-row text-amber-600">
                                            <span>Tax Amount</span>
                                            <span>₹{selectedBill.tax_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {selectedBill.discount_amount > 0 && (
                                        <div className="pi-calc-row text-rose-500">
                                            <span>Discount</span>
                                            <span>-₹{selectedBill.discount_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="pi-calc-total">
                                        <span>Grand Total</span>
                                        <span>₹{selectedBill.grand_total?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="pi-calc-row text-emerald-600 pt-2 border-t border-slate-100 mt-2">
                                        <span className="font-black uppercase text-[10px]">Settlement</span>
                                        <div className="flex flex-col items-end">
                                            {selectedBill.payment_modes?.map((pm, i) => (
                                                <span key={i} className="font-black text-xs">{pm.type}: ₹{pm.amount}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    <button 
                                        onClick={() => setPrintingBillId(selectedBill._id)}
                                        className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <CheckCircle2 size={20} /> PRINT INVOICE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {printingBillId && (
                    <BillPreviewModal 
                        isOpen={!!printingBillId} 
                        billId={printingBillId} 
                        onClose={() => setPrintingBillId(null)}
                        paymentModes={selectedBill?.payment_modes}
                    />
                )}

                {fetchingDetail && (
                    <div className="pi-modal-overlay">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-white" size={48} />
                            <p className="text-white font-black tracking-widest uppercase text-xs">Accessing Sales Vault...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BillsAndSalesPage;
