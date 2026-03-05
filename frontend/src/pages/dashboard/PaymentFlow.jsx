import React, { useState, useEffect } from 'react';
import './BillingPage.css';
import { CreditCard, Smartphone, Wallet, Split, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const PaymentFlow = ({
    grandTotal,
    onPaymentSubmit,
    onCancel,
    loading = false,
    initialType = ''
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPaymentType, setSelectedPaymentType] = useState('');
    const [paymentMode, setPaymentMode] = useState('FULL');
    const [paymentData, setPaymentData] = useState({
        cashAmount: '',
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
        tipAmount: ''
    });

    useEffect(() => {
        if (initialType) {
            handlePaymentTypeSelect(initialType);
        }
    }, [initialType]);

    const cashAmount = parseFloat(paymentData.cashAmount) || 0;
    const upiAmount = parseFloat(paymentData.upiAmount) || 0;
    const cardAmount = parseFloat(paymentData.cardAmount) || 0;
    const tipAmount = parseFloat(paymentData.tipAmount) || 0;

    const totalPaid = cashAmount + upiAmount + cardAmount;
    const totalDueWithTip = grandTotal + tipAmount;
    const remaining = Math.max(0, totalDueWithTip - totalPaid);
    const balanceToReturn = Math.max(0, (parseFloat(paymentData.cashReceived) || 0) - cashAmount);

    const resetAllPayments = () => {
        setPaymentData({ cashAmount: '', cashReceived: '', upiAmount: '', cardAmount: '' });
    };

    const handleInputChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentTypeSelect = (type) => {
        resetAllPayments();
        setSelectedPaymentType(type);
        if (type === 'SPLIT') {
            setCurrentStep(2);
        } else {
            setPaymentMode('FULL');
            setCurrentStep(3);
            if (type === 'CASH') setPaymentData(prev => ({ ...prev, cashAmount: grandTotal.toFixed(2) }));
            else if (type === 'UPI') setPaymentData(prev => ({ ...prev, upiAmount: grandTotal.toFixed(2) }));
            else if (type === 'CARD') setPaymentData(prev => ({ ...prev, cardAmount: grandTotal.toFixed(2) }));
        }
    };

    const handleSubmit = () => {
        const paymentModes = [];
        if (cashAmount > 0) paymentModes.push({ type: 'CASH', amount: cashAmount, cash_received: parseFloat(paymentData.cashReceived) || 0, balance_return: balanceToReturn });
        if (upiAmount > 0) paymentModes.push({ type: 'UPI', amount: upiAmount });
        if (cardAmount > 0) paymentModes.push({ type: 'CARD', amount: cardAmount });
        onPaymentSubmit(paymentModes, tipAmount);
    };

    const isPayDisabled = totalPaid < (grandTotal - 0.01);

    return (
        <div className="payment-flow-container animate-in fade-in duration-300">
            <div className="flow-header">
                <button className="back-to-menu-btn" onClick={onCancel}>
                    <ChevronLeft size={20} /> Back to Catalog
                </button>
                <div className="flow-steps">
                    <span className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>1</span>
                    <div className="step-line"></div>
                    <span className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>2</span>
                    <div className="step-line"></div>
                    <span className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>3</span>
                </div>
            </div>

            <div className="flow-content">
                {currentStep === 1 && (
                    <div className="step-view">
                        <h3 className="section-title">Select Payment Method</h3>
                        <div className="payment-options-grid">
                            <button className="payment-option-card" onClick={() => handlePaymentTypeSelect('CASH')}>
                                <div className="option-icon cash"><Wallet size={32} /></div>
                                <div className="option-info">
                                    <span className="option-name">Cash</span>
                                    <span className="option-desc">Physical currency</span>
                                </div>
                            </button>
                            <button className="payment-option-card" onClick={() => handlePaymentTypeSelect('UPI')}>
                                <div className="option-icon upi"><Smartphone size={32} /></div>
                                <div className="option-info">
                                    <span className="option-name">UPI / QR</span>
                                    <span className="option-desc">Scan and pay</span>
                                </div>
                            </button>
                            <button className="payment-option-card" onClick={() => handlePaymentTypeSelect('CARD')}>
                                <div className="option-icon card"><CreditCard size={32} /></div>
                                <div className="option-info">
                                    <span className="option-name">Card</span>
                                    <span className="option-desc">Credit or Debit</span>
                                </div>
                            </button>
                            <button className="payment-option-card" onClick={() => handlePaymentTypeSelect('SPLIT')}>
                                <div className="option-icon split"><Split size={32} /></div>
                                <div className="option-info">
                                    <span className="option-name">Split Bill</span>
                                    <span className="option-desc">Multiple methods</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-view">
                        <h3 className="section-title">Split Payment Configuration</h3>
                        <div className="split-config-options">
                            <button className={`config-btn ${paymentMode === 'FULL' ? 'active' : ''}`} onClick={() => { setPaymentMode('FULL'); setCurrentStep(3); }}>
                                <CheckCircle2 size={24} />
                                <div className="text-left">
                                    <p className="font-bold">Standard Split</p>
                                    <p className="text-sm opacity-80">One method at a time</p>
                                </div>
                            </button>
                            <button className={`config-btn ${paymentMode === 'PARTIAL' ? 'active' : ''}`} onClick={() => { setPaymentMode('PARTIAL'); setCurrentStep(3); }}>
                                <Split size={24} />
                                <div className="text-left">
                                    <p className="font-bold">Multi-Method</p>
                                    <p className="text-sm opacity-80">Mix cash, card, & upi</p>
                                </div>
                            </button>
                        </div>
                        <div className="flow-footer">
                            <button className="flow-btn secondary" onClick={() => setCurrentStep(1)}>Back</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="step-view">
                        <div className="checkout-summary-bar">
                            <div className="summary-item">
                                <span className="label">Bill Amount</span>
                                <span className="value">₹{grandTotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Add Tip</span>
                                <input
                                    type="number"
                                    className="tip-input-summary"
                                    placeholder="0"
                                    value={paymentData.tipAmount}
                                    onChange={(e) => handleInputChange('tipAmount', e.target.value)}
                                />
                            </div>
                            <div className="summary-item">
                                <span className="label">Total Paid</span>
                                <span className="value success">₹{totalPaid.toFixed(2)}</span>
                            </div>
                            {remaining > 0 && (
                                <div className="summary-item">
                                    <span className="label">Due</span>
                                    <span className="value warning">₹{remaining.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="payment-entry-section">
                            {(selectedPaymentType === 'CASH' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                                <div className="entry-card cash">
                                    <div className="entry-header">
                                        <Wallet size={18} /> <span>Cash Details</span>
                                    </div>
                                    <div className="entry-grid">
                                        <div className="input-group">
                                            <label>Amount</label>
                                            <input type="number" value={paymentData.cashAmount} onChange={(e) => handleInputChange('cashAmount', e.target.value)} />
                                        </div>
                                        <div className="input-group">
                                            <label>Received</label>
                                            <input type="number" value={paymentData.cashReceived} onChange={(e) => handleInputChange('cashReceived', e.target.value)} />
                                        </div>
                                        <div className="input-group full">
                                            <label>Change</label>
                                            <div className="read-only-val">₹{balanceToReturn.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedPaymentType === 'UPI' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                                <div className="entry-card upi">
                                    <div className="entry-header">
                                        <Smartphone size={18} /> <span>UPI Details</span>
                                    </div>
                                    <div className="input-group">
                                        <label>Amount</label>
                                        <input type="number" value={paymentData.upiAmount} onChange={(e) => handleInputChange('upiAmount', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {(selectedPaymentType === 'CARD' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                                <div className="entry-card card">
                                    <div className="entry-header">
                                        <CreditCard size={18} /> <span>Card Details</span>
                                    </div>
                                    <div className="input-group">
                                        <label>Amount</label>
                                        <input type="number" value={paymentData.cardAmount} onChange={(e) => handleInputChange('cardAmount', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flow-footer sticky-footer">
                            <button className="flow-btn secondary" onClick={() => setCurrentStep(selectedPaymentType === 'SPLIT' ? 2 : 1)}>Back</button>
                            <button className="flow-btn primary" disabled={isPayDisabled || loading} onClick={handleSubmit}>
                                {loading ? 'Processing...' : `PAY ₹${totalPaid.toFixed(2)} & FINISH`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentFlow;
