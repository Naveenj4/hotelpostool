import { useNavigate } from 'react-router-dom';

export default function ReportNavigationDropdown() {
    const navigate = useNavigate();
    return (
        <div className="relative">
            <select 
                className="bg-white border text-center border-slate-200 shadow-sm text-slate-700 h-10 px-6 rounded-xl text-[10.5px] font-black uppercase tracking-widest appearance-none pr-10 cursor-pointer hover:border-slate-900 transition-all outline-none md:h-12"
                defaultValue=""
                onChange={(e) => e.target.value && navigate(e.target.value)}
            >
                <option value="" disabled>Go to Specific Report...</option>
                <option value="/dashboard/self-service/stock">Stock Master</option>
                <optgroup label="Sales Summary">
                    <option value="/dashboard/self-service/reports/sales/day">Day Wise</option>
                    <option value="/dashboard/self-service/reports/sales/month">Month Wise</option>
                    <option value="/dashboard/self-service/reports/sales/item">Item Wise</option>
                    <option value="/dashboard/self-service/reports/sales/category">Category Wise</option>
                    <option value="/dashboard/self-service/reports/sales/transaction">Transaction Wise</option>
                    <option value="/dashboard/self-service/reports/sales/profit">Sales Profit</option>
                </optgroup>
                <optgroup label="Purchase Summary">
                    <option value="/dashboard/self-service/reports/purchase/day">Day Wise</option>
                    <option value="/dashboard/self-service/reports/purchase/supplier">Supplier Wise</option>
                </optgroup>
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
            </span>
        </div>
    );
}
