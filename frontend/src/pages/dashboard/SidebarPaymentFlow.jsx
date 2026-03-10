import React, { useState, useEffect } from 'react';
import { Wallet, Smartphone, CreditCard, Info } from 'lucide-react';
import './BillingPage.css';

const SidebarPaymentFlow = ({
    grandTotal,
    onPaymentSubmit,
    onCancel,
    loading = false
}) => {
    const [isSplit, setIsSplit] = useState(false);
    const [activeMethod, setActiveMethod] = useState('CASH');
    const [data, setData] = useState({
        cashAmount: '',
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
        tipAmount: ''
    });

    useEffect(() => {
        if (!isSplit) {
            const reset = { ...data, cashAmount: '', upiAmount: '', cardAmount: '' };
            if (activeMethod === 'CASH') reset.cashAmount = grandTotal.toFixed(2);
            else if (activeMethod === 'UPI') reset.upiAmount = grandTotal.toFixed(2);
            else if (activeMethod === 'CARD') reset.cardAmount = grandTotal.toFixed(2);
            setData(reset);
        }
    }, [isSplit, activeMethod, grandTotal]);

    const cashVal = parseFloat(data.cashAmount) || 0;
    const upiVal = parseFloat(data.upiAmount) || 0;
    const cardVal = parseFloat(data.cardAmount) || 0;
    const rcvdVal = parseFloat(data.cashReceived) || 0;
    const tipVal = parseFloat(data.tipAmount) || 0;

    const totalPaid = cashVal + upiVal + cardVal;
    const balance = Math.max(0, rcvdVal - cashVal);
    const remaining = Math.max(0, (grandTotal + tipVal) - totalPaid);

    const handleInput = (f, v) => setData(p => ({ ...p, [f]: v }));

    const submit = () => {
        const modes = [];
        if (cashVal > 0) modes.push({ type: 'CASH', amount: cashVal, cash_received: rcvdVal, balance_return: balance });
        if (upiVal > 0) modes.push({ type: 'UPI', amount: upiVal });
        if (cardVal > 0) modes.push({ type: 'CARD', amount: cardVal });
        onPaymentSubmit(modes, tipVal);
    };

    return (
        <div className="sidebar-payment-container animate-in slide-in-from-bottom-2">
            <div className="payment-config-header">
                <div className="split-toggle">
                    <label>Split Payment</label>
                    <label className="switch">
                        <input type="checkbox" checked={isSplit} onChange={() => setIsSplit(!isSplit)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                {!isSplit && (
                    <div className="method-pills">
                        <button className={activeMethod === 'CASH' ? 'active' : ''} onClick={() => setActiveMethod('CASH')}>CASH</button>
                        <button className={activeMethod === 'UPI' ? 'active' : ''} onClick={() => setActiveMethod('UPI')}>UPI</button>
                        <button className={activeMethod === 'CARD' ? 'active' : ''} onClick={() => setActiveMethod('CARD')}>CARD</button>
                    </div>
                )}
            </div>

            <div className="payment-sidebar-grid">
                {/* CASH ROW */}
                {(isSplit || activeMethod === 'CASH') && (
                    <div className="payment-row highlight-cash">
                        <div className="row-label">
                            <Wallet size={16} />
                            <span>CASH</span>
                        </div>
                        <div className="row-inputs">
                            <div className="input-box">
                                <label>Amount</label>
                                <input type="number" value={data.cashAmount} onChange={e => handleInput('cashAmount', e.target.value)} readOnly={!isSplit} />
                            </div>
                            <div className="input-box">
                                <label>Received</label>
                                <input type="number" value={data.cashReceived} onChange={e => handleInput('cashReceived', e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="calc-box">
                                <label>Balance</label>
                                <div className="val">₹{balance.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* UPI ROW */}
                {(isSplit || activeMethod === 'UPI') && (
                    <div className="payment-row highlight-upi">
                        <div className="row-label">
                            <Smartphone size={16} />
                            <span>UPI</span>
                        </div>
                        <div className="row-inputs">
                            <div className="input-box full">
                                <label>UPI Amount</label>
                                <input type="number" value={data.upiAmount} onChange={e => handleInput('upiAmount', e.target.value)} readOnly={!isSplit} />
                            </div>
                        </div>
                    </div>
                )}

                {/* CARD ROW */}
                {(isSplit || activeMethod === 'CARD') && (
                    <div className="payment-row highlight-card">
                        <div className="row-label">
                            <CreditCard size={16} />
                            <span>CARD</span>
                        </div>
                        <div className="row-inputs">
                            <div className="input-box full">
                                <label>Card Amount</label>
                                <input type="number" value={data.cardAmount} onChange={e => handleInput('cardAmount', e.target.value)} readOnly={!isSplit} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="payment-sidebar-summary">
                <div className="summary-line">
                    <span>Total Due:</span>
                    <span className="mono">₹{(grandTotal + tipVal).toFixed(2)}</span>
                </div>
                <div className="summary-line success">
                    <span>Paid:</span>
                    <span className="mono">₹{totalPaid.toFixed(2)}</span>
                </div>
                {remaining > 0 && (
                    <div className="summary-line warning">
                        <span>Remaining:</span>
                        <span className="mono">₹{remaining.toFixed(2)}</span>
                    </div>
                )}
            </div>

            <div className="payment-sidebar-actions">
                <button className="pay-cancel-btn" onClick={onCancel}>BACK</button>
                <button className="pay-finish-btn" onClick={submit} disabled={loading || totalPaid < (grandTotal - 0.01)}>
                    {loading ? '...' : `FINISH PAY ₹${totalPaid.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
};

export default SidebarPaymentFlow;
