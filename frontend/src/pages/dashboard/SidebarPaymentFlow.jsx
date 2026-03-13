import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Smartphone, CreditCard, Info } from 'lucide-react';
import './BillingPage.css';

const SidebarPaymentFlow = ({
    grandTotal = 0,
    onPaymentSubmit,
    onCancel,
    loading = false
}) => {
    const [activeMethod, setActiveMethod] = useState('CASH');
    const [data, setData] = useState({
        cashAmount: '',
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
        tipAmount: ''
    });

    // Defensive parsing
    const gTotal = parseFloat(grandTotal) || 0;
    const tipVal = parseFloat(data.tipAmount) || 0;
    const netPayable = gTotal + tipVal;

    const cashAmt = parseFloat(data.cashAmount) || 0;
    const upiAmt = parseFloat(data.upiAmount) || 0;
    const cardAmt = parseFloat(data.cardAmount) || 0;
    const rcvdVal = parseFloat(data.cashReceived) || 0;

    const totalPaid = cashAmt + upiAmt + cardAmt;
    const cashBalance = Math.max(0, rcvdVal - cashAmt);

    // Auto-fill total on first mount
    useEffect(() => {
        if (totalPaid === 0 && netPayable > 0) {
            setData(prev => ({ ...prev, cashAmount: netPayable.toFixed(2) }));
        }
    }, [netPayable]);

    const handleInput = (f, v) => setData(p => ({ ...p, [f]: v }));

    const selectMethod = (method) => {
        const oldMethod = activeMethod;
        setActiveMethod(method);
        if (method === oldMethod) return;

        const oldKey = oldMethod.toLowerCase() + 'Amount';
        const newKey = method.toLowerCase() + 'Amount';
        
        let effectiveOldVal = parseFloat(data[oldKey]) || 0;
        const currentNewVal = parseFloat(data[newKey]) || 0;

        // If leaving CASH and the 'Received' amount is less than the cash portion,
        // we assume the user only wants to pay that received amount in cash.
        const isImplicitCashSplit = (oldMethod === 'CASH' && rcvdVal > 0 && rcvdVal < effectiveOldVal);
        if (isImplicitCashSplit) {
            effectiveOldVal = rcvdVal;
        }

        const sumOthers = totalPaid - (parseFloat(data[oldKey]) || 0) - currentNewVal;
        const totalWithEffective = sumOthers + effectiveOldVal;

        // Case 1: Pure Switch
        // If the old method was the only one used AND it covers the full total
        if (sumOthers < 0.01 && effectiveOldVal >= (netPayable - 0.01)) {
            setData(prev => ({
                ...prev,
                [oldKey]: '',
                [newKey]: netPayable.toFixed(2)
            }));
        } 
        // Case 2: Split / Remainder
        else {
            const remainder = Math.max(0, netPayable - totalWithEffective);
            setData(prev => {
                const update = { ...prev };
                if (isImplicitCashSplit) update.cashAmount = effectiveOldVal.toFixed(2);
                if (remainder > 0) update[newKey] = remainder.toFixed(2);
                return update;
            });
        }
    };

    const submit = () => {
        if (!onPaymentSubmit) return;
        const modes = [];
        if (cashAmt > 0) modes.push({ type: 'CASH', amount: cashAmt, cash_received: rcvdVal, balance_return: cashBalance });
        if (upiAmt > 0) modes.push({ type: 'UPI', amount: upiAmt });
        if (cardAmt > 0) modes.push({ type: 'CARD', amount: cardAmt });
        onPaymentSubmit(modes, tipVal);
    };

    const isConfirmDisabled = useMemo(() => {
        if (loading) return true;
        // Sum must exactly match or slightly exceed net (allowing for small float diffs)
        const isCovered = totalPaid >= (netPayable - 0.01);
        if (!isCovered) return true;

        // Cash specific: if any cash amount is set, received must cover it
        if (cashAmt > 0) {
            if (!data.cashReceived || rcvdVal < (cashAmt - 0.01)) return true;
        }

        return false;
    }, [loading, totalPaid, netPayable, cashAmt, data.cashReceived, rcvdVal]);

    const usedModesCount = [cashAmt, upiAmt, cardAmt].filter(a => a > 0).length;

    return (
        <div className="payment-modal-overlay">
            <div className="sidebar-payment-container animate-in slide-in-from-bottom-2">
                <div className="unified-payment-rectangle">
                    {/* CASH ROW MODULE */}
                    <div className={`unified-row-module ${activeMethod === 'CASH' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => selectMethod('CASH')}>
                            <div className="method-selector">
                                <Wallet size={18} />
                                <span>CASH</span>
                            </div>
                        </div>
                        <div className="row-fields-grid">
                            <div className="field-item">
                                <label>CASH AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={data.cashAmount}
                                    onChange={e => handleInput('cashAmount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="field-item">
                                <label>RECEIVED</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={data.cashReceived}
                                    onChange={e => handleInput('cashReceived', e.target.value)}
                                    placeholder="0.00"
                                    disabled={cashAmt <= 0 && activeMethod !== 'CASH'}
                                />
                            </div>
                            <div className="field-item">
                                <label>BALANCE</label>
                                <span className={`static-val ${cashBalance > 0 ? 'success' : ''}`}>₹{cashBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* UPI ROW MODULE */}
                    <div className={`unified-row-module ${activeMethod === 'UPI' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => selectMethod('UPI')}>
                            <div className="method-selector">
                                <Smartphone size={18} />
                                <span>UPI</span>
                            </div>
                        </div>
                        <div className="row-fields-grid">
                            <div className="field-item">
                                <label>UPI AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={data.upiAmount}
                                    onChange={e => handleInput('upiAmount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="field-item"></div>
                            <div className="field-item"></div>
                        </div>
                    </div>

                    {/* CARD ROW MODULE */}
                    <div className={`unified-row-module ${activeMethod === 'CARD' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => selectMethod('CARD')}>
                            <div className="method-selector">
                                <CreditCard size={18} />
                                <span>CARD</span>
                            </div>
                        </div>
                        <div className="row-fields-grid">
                            <div className="field-item">
                                <label>CARD AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={data.cardAmount}
                                    onChange={e => handleInput('cardAmount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="field-item"></div>
                            <div className="field-item"></div>
                        </div>
                    </div>

                    <div className="unified-summary-panel">
                        <div className="tip-box">
                            <label>ADD TIP / EXTRA</label>
                            <input
                                type="number"
                                className="tip-input-mini"
                                value={data.tipAmount}
                                onChange={e => handleInput('tipAmount', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="net-total-box">
                            <label>NET PAYABLE</label>
                            <span className="final-amt">₹{netPayable.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="unified-action-area">
                        <button
                            className="confirm-payment-btn"
                            onClick={submit}
                            disabled={isConfirmDisabled}
                        >
                            {loading ? 'PROCESSING...' : `CONFIRM ${usedModesCount > 1 ? 'SPLIT' : activeMethod} PAYMENT`}
                        </button>
                        <button className="unified-back-btn" onClick={onCancel}>Cancel and go back</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarPaymentFlow;
