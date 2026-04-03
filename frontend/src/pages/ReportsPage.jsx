import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
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

import './ReportsPage.css';

const ReportsPage = () => {
    const location = useLocation();
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
                    
                    {/* Navigation Control Bar */}
                    <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl p-3 mb-6 flex flex-col lg:flex-row lg:items-center justify-between z-20 relative gap-3 flex-shrink-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <ReportNavigationDropdown />
                            <div className="h-6 w-px bg-slate-100 hidden lg:block mx-2"></div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                    category === 'sales'       ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    category === 'purchase'    ? 'bg-indigo-50  text-indigo-600  border-indigo-100'  :
                                    category === 'outstanding' ? 'bg-rose-50    text-rose-600    border-rose-100'    :
                                                                 'bg-amber-50   text-amber-600   border-amber-100'
                                }`}>
                                    {category}
                                </span>
                                <span className="text-slate-200 font-bold">/</span>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {filter.replace(/-/g, ' ')}
                                </span>
                            </div>
                        </div>
                        {/* Live indicator */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live System Feed</span>
                        </div>
                    </div>

                    {/* Report Content Container */}
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden relative min-h-0 flex flex-col">
                        {renderActiveReport()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;

