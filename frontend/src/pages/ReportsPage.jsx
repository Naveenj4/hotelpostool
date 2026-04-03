import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StockPage from './StockPage';
import GenericSummaryReport from './dashboard/GenericSummaryReport';

// Sales Reports
import DayWiseSales from './dashboard/DayWiseSales';
import MonthWiseSales from './dashboard/MonthWiseSales';
import ItemWiseSales from './dashboard/ItemWiseSales';
import CategoryWiseSales from './dashboard/CategoryWiseSales';
import TransactionWiseSales from './dashboard/TransactionWiseSales';
import SalesProfit from './dashboard/SalesProfit';

// Purchase Reports
import DayWisePurchase from './dashboard/DayWisePurchase';
import SupplierWisePurchase from './dashboard/SupplierWisePurchase';

// Outstanding Reports
import SupplierOutstanding from './dashboard/SupplierOutstanding';
import CustomerOutstanding from './dashboard/CustomerOutstanding';
import AccountsReceivable from './dashboard/AccountsReceivable';
import AccountsPayable from './dashboard/AccountsPayable';

import {
    PackageOpen, BarChart3, ShoppingCart, CreditCard,
    Grid, TrendingDown, MinusCircle, AlertTriangle, ArrowDownRight,
    Activity, FileText, Calendar, PieChart, Box, Layers, TrendingUp, Tag,
    UserCircle, Users, ChevronRight, Search
} from 'lucide-react';
import './ReportsPage.css';

const CATEGORIES = [
    { key: 'stock', label: 'Stock Report', icon: <PackageOpen size={18} />, color: '#f59e0b', bg: '#fef3c7' },
    { key: 'sales', label: 'Sales Summary', icon: <BarChart3 size={18} />, color: '#10b981', bg: '#d1fae5' },
    { key: 'purchase', label: 'Purchase Summary', icon: <ShoppingCart size={18} />, color: '#6366f1', bg: '#e0e7ff' },
    { key: 'outstanding', label: 'Outstanding', icon: <CreditCard size={18} />, color: '#f43f5e', bg: '#ffe4e6' }
];

const FILTERS = {
    stock: [
        { key: 'all', label: 'All Stock', icon: <Grid size={14} /> },
        { key: 'negative', label: 'Negative', icon: <TrendingDown size={14} /> },
        { key: 'nil', label: 'Nil Stock', icon: <MinusCircle size={14} /> },
        { key: 'min', label: 'Below Min', icon: <AlertTriangle size={14} /> },
        { key: 'max', label: 'Maximum', icon: <ArrowDownRight size={14} /> },
        { key: 'moving', label: 'Moving', icon: <Activity size={14} /> },
        { key: 'non-moving', label: 'Non Moving', icon: <Box size={14} /> },
        { key: 'transaction', label: 'Transaction', icon: <FileText size={14} /> }
    ],
    sales: [
        { key: 'day', label: 'Day Wise', icon: <Calendar size={14} /> },
        { key: 'month', label: 'Month Wise', icon: <PieChart size={14} /> },
        { key: 'item', label: 'Item Wise', icon: <Box size={14} /> },
        { key: 'group', label: 'Group Wise', icon: <Layers size={14} /> },
        { key: 'transaction', label: 'Transaction', icon: <FileText size={14} /> },
        { key: 'profit', label: 'Profit Audit', icon: <TrendingUp size={14} /> },
        { key: 'brand', label: 'Brand Wise', icon: <Tag size={14} /> },
        { key: 'captain', label: 'Captain Wise', icon: <UserCircle size={14} /> },
        { key: 'agent', label: 'Agent Wise', icon: <Users size={14} /> }
    ],
    purchase: [
        { key: 'day', label: 'Day Wise', icon: <Calendar size={14} /> },
        { key: 'month', label: 'Month Wise', icon: <PieChart size={14} /> },
        { key: 'item', label: 'Item Wise', icon: <Box size={14} /> },
        { key: 'group', label: 'Group Wise', icon: <Layers size={14} /> },
        { key: 'brand', label: 'Brand Wise', icon: <Tag size={14} /> },
        { key: 'supplier', label: 'Supplier Wise', icon: <Users size={14} /> }
    ],
    outstanding: [
        { key: 'customer', label: 'Customer Wise', icon: <UserCircle size={14} /> },
        { key: 'supplier', label: 'Supplier Wise', icon: <Users size={14} /> },
        { key: 'receivable', label: 'Receivable', icon: <TrendingUp size={14} /> },
        { key: 'payable', label: 'Payable', icon: <TrendingDown size={14} /> }
    ]
};

const ReportsPage = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Add useNavigate here
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category') || 'stock';
    const filter = searchParams.get('filter') || 'all';

    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const getHeaderTitle = () => {
        switch(category) {
            case 'stock': return 'Inventory Master Hub';
            case 'sales': return 'Sales Summary Hub';
            case 'purchase': return 'Purchase Audit Hub';
            case 'outstanding': return 'Financial Outstanding Hub';
            default: return 'Dynamic Reports Hub';
        }
    };

    const renderActiveReport = () => {
        // Use a composite key of category and filter to ensure clean remounts.
        const componentKey = `${category}-${filter}`;

        // ── STOCK ─────────────────────────────────────────────────────────────
        if (category === 'stock') {
            if (filter === 'valuation') {
                return (
                    <GenericSummaryReport 
                        key={componentKey} 
                        isEmbedded={true} 
                        title="Stock Valuation Report" 
                        endpoint="/reports/stock-valuation" 
                    />
                );
            }
            return <StockPage key={componentKey} isEmbedded={true} embeddedFilter={filter} />;
        }

        // ── SALES ─────────────────────────────────────────────────────────────
        if (category === 'sales') {
            switch (filter) {
                case 'day': return <DayWiseSales key={componentKey} isEmbedded={true} />;
                case 'month': return <MonthWiseSales key={componentKey} isEmbedded={true} />;
                case 'item': return <ItemWiseSales key={componentKey} isEmbedded={true} />;
                case 'group': return <CategoryWiseSales key={componentKey} isEmbedded={true} />;
                case 'transaction': return <TransactionWiseSales key={componentKey} isEmbedded={true} />;
                case 'profit': return <SalesProfit key={componentKey} isEmbedded={true} />;
                case 'brand': 
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Brand Wise Sales" endpoint="/reports/sales-by-brand" />;
                case 'captain':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Captain Wise Sales" endpoint="/reports/sales-by-captain" />;
                case 'agent':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Personnel Sales" endpoint="/reports/sales/summary" groupBy="WAITER" />;
                default: 
                    return <DayWiseSales key={componentKey} isEmbedded={true} />;
            }
        }

        // ── PURCHASE ──────────────────────────────────────────────────────────
        if (category === 'purchase') {
            switch (filter) {
                case 'day': return <DayWisePurchase key={componentKey} isEmbedded={true} />;
                case 'supplier': return <SupplierWisePurchase key={componentKey} isEmbedded={true} />;
                case 'month':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Month Wise Purchase" endpoint="/reports/purchase-summary" groupBy="MONTH" />;
                case 'item':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Item Wise Purchase" endpoint="/reports/purchase-summary" groupBy="ITEM" />;
                case 'group':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Group Wise Purchase" endpoint="/reports/purchase-summary" groupBy="CATEGORY" />;
                case 'brand':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Brand Wise Purchase" endpoint="/reports/purchase-summary" groupBy="BRAND" />;
                default:
                    return <DayWisePurchase key={componentKey} isEmbedded={true} />;
            }
        }

        // ── OUTSTANDING ───────────────────────────────────────────────────────
        if (category === 'outstanding') {
            switch (filter) {
                case 'customer': return <CustomerOutstanding key={componentKey} isEmbedded={true} />;
                case 'supplier': return <SupplierOutstanding key={componentKey} isEmbedded={true} />;
                case 'receivable':
                    return <AccountsReceivable key={componentKey} isEmbedded={true} />;
                case 'payable':
                    return <AccountsPayable key={componentKey} isEmbedded={true} />;
                default:
                    return <CustomerOutstanding key={componentKey} isEmbedded={true} />;
            }
        }

        // ── FALLBACK ──────────────────────────────────────────────────────────
        return <StockPage key={componentKey} isEmbedded={true} embeddedFilter={filter} />;
    };

    return (
        <div className="dashboard-layout bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans flex flex-col">
                <Header toggleSidebar={toggleSidebar} title={getHeaderTitle()} />
                
                <div className="fade-in px-6 lg:px-10 py-6 max-w-[2000px] mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
                    
                    {/* Integrated Compact Navigation Hub */}
                    <div className="bg-white border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] rounded-[1.5rem] p-2 mb-6 z-20 relative flex flex-col gap-2 flex-shrink-0">
                        {/* Category Selector (Compact Tabs) */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 bg-slate-50/50 rounded-xl">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => navigate(`/dashboard/self-service/reports?category=${cat.key}&filter=${FILTERS[cat.key][0].key}`)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        category === cat.key 
                                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                                >
                                    <span style={{ color: category === cat.key ? cat.color : '#94a3b8' }}>{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Chip Hub (Very Compact) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1">
                            {(FILTERS[category] || []).map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => navigate(`/dashboard/self-service/reports?category=${category}&filter=${f.key}`)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                        filter === f.key
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                            : 'text-slate-400 hover:text-slate-500 hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <span className={filter === f.key ? 'text-indigo-500' : 'text-slate-300'}>{f.icon}</span>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Report Content Container */}
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden relative min-h-0 flex flex-col">
                        <div className="flex-1 overflow-y-auto scrollbar-premium is-embedded">
                            {renderActiveReport()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;

