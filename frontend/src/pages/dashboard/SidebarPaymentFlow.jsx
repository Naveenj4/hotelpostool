import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Smartphone, CreditCard, Save, Printer, ArrowLeft } from 'lucide-react';
import './BillingPage.css';

const SidebarPaymentFlow = ({
    grandTotal = 0,
    onPaymentSubmit,
    onCancel,
    partialAllowed = false,
    loading = false
}) => {
    const [data, setData] = useState({
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
    });

    const billedAmt = parseFloat(grandTotal) || 0;
    const [cashAmounts, setCashAmounts] = useState({ received: '' });
    const [upiAmount, setUpiAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');

    const calculateFinancials = () => {
        const cashRec = parseFloat(cashAmounts.received) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        
        const otherPayments = upi + card;
        const totalPotential = cashRec + otherPayments;
        
        let pending = Math.max(0, grandTotal - totalPotential);
        let cashUsed = 0;
        let balance = 0;

        if (totalPotential >= grandTotal) {
            cashUsed = Math.max(0, grandTotal - otherPayments);
            balance = cashRec - cashUsed;
            pending = 0;
        } else {
            cashUsed = cashRec;
            balance = 0;
            pending = grandTotal - totalPotential;
        }

        return {
            pending,
            balance,
            cashUsed
        };
    };

    const { pending, balance, cashUsed } = calculateFinancials();

    const handleSubmit = (shouldPrint = false) => {
        const modes = [];
        if (cashUsed > 0) modes.push({ type: 'CASH', amount: cashUsed });
        if (parseFloat(upiAmount) > 0) modes.push({ type: 'UPI', amount: parseFloat(upiAmount) });
        if (parseFloat(cardAmount) > 0) modes.push({ type: 'CARD', amount: parseFloat(cardAmount) });

        if (modes.length === 0) return alert("Please enter payment amount");
        if (pending > 0 && !partialAllowed) {
            return alert(`Please collect full amount (Pending: ₹${pending.toFixed(2)})`);
        }

        onPaymentSubmit(modes, 0, pending > 0, 0, { shouldPrint });
    };

    const isConfirmDisabled = useMemo(() => {
        if (loading) return true;
        return false;
    }, [loading]);

    return (
        <div className="payment-modal-overlay">
            <div className="sidebar-payment-container animate-in slide-in-from-bottom-2">
                <div className="unified-payment-rectangle">
                    {/* 1st ROW: CASH */}
                    <div className="unified-row-module active-row">
                        <div className="row-header">
                            <div className="method-selector">
                                <Wallet size={18} />
                                <span>CASH</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-2">
                            <div className="payment-field">
                                <label>RECEIVED AMT</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="unified-input"
                                    value={cashAmounts.received} 
                                    onChange={(e) => setCashAmounts({ ...cashAmounts, received: e.target.value })}
                                />
                            </div>
                            <div className="payment-field">
                                <label>BALANCE AMOUNT</label>
                                <div className="display-value balance">
                                    ₹{balance.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2nd ROW: UPI */}
                    <div className="unified-row-module">
                        <div className="row-header">
                            <div className="method-selector">
                                <Smartphone size={18} />
                                <span>UPI</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-1">
                            <div className="field-item">
                                <label>UPI AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={upiAmount}
                                    onChange={e => setUpiAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3rd ROW: CARD */}
                    <div className="unified-row-module">
                        <div className="row-header">
                            <div className="method-selector">
                                <CreditCard size={18} />
                                <span>CARD</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-1">
                            <div className="field-item">
                                <label>CARD AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={cardAmount}
                                    onChange={e => setCardAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BILL DETAILS SUMMARY */}
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Billed Amt</span>
                            <span className="text-xl font-black text-slate-800">₹{parseFloat(grandTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Pending Amt</span>
                            <span className={`text-xl font-black ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {pending > 0 ? `₹${pending.toFixed(2)}` : 'PAID'}
                            </span>
                        </div>
                    </div>

                    <div className="payment-actions">
                        <button 
                            className="btn-pay-action btn-save" 
                            onClick={() => handleSubmit(false)} 
                            disabled={loading || (pending > 0 && !partialAllowed && (parseFloat(cashAmounts.received) > 0 || parseFloat(upiAmount) > 0 || parseFloat(cardAmount) > 0))}
                        >
                            <Save size={20} />
                            <span>SAVE</span>
                        </button>
                        <button 
                            className="btn-pay-action btn-print" 
                            onClick={() => handleSubmit(true)} 
                            disabled={loading || (pending > 0 && !partialAllowed)}
                        >
                            <Printer size={20} />
                            <span>SAVE & PRINT</span>
                        </button>
                    </div>
                    <button className="unified-back-btn mt-4 w-full flex items-center justify-center gap-2" onClick={onCancel}>
                        <ArrowLeft size={14} /> Back to Billing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SidebarPaymentFlow;
