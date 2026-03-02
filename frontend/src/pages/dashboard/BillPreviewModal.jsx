import React, { useState, useEffect } from 'react';
import { Printer, X, CheckCircle2, Loader2 } from 'lucide-react';

const BillPreviewModal = ({ isOpen, onClose, billId, paymentModes }) => {
    const [billData, setBillData] = useState(null);
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && billId) fetchBillDetails();
    }, [isOpen, billId]);

    const fetchBillDetails = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const billRes = await fetch(`${import.meta.env.VITE_API_URL}/bills/${billId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const billResult = await billRes.json();
            if (billResult.success) {
                setBillData(billResult.data);
                const restaurantRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const restaurantResult = await restaurantRes.json();
                if (restaurantResult.success) setRestaurantData(restaurantResult.data.restaurant);
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPaymentMethod = (modes) => {
        if (!modes || modes.length === 0) return 'N/A';
        if (modes.length === 1) return modes[0].type;
        return 'SPLIT';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handlePrint = () => {
        const printContent = document.getElementById('bill-print-content');
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="bpm-overlay">
            <div className="bpm-modal">

                {/* Header */}
                <div className="bpm-header">
                    <div className="bpm-header-left">
                        <div className="bpm-success-icon">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <h3 className="bpm-title">Payment Successful</h3>
                            <p className="bpm-subtitle">Bill #{billData?.bill_number || '...'}</p>
                        </div>
                    </div>
                    <button className="bpm-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="bpm-body">
                    {loading ? (
                        <div className="bpm-loading">
                            <Loader2 size={32} className="bpm-spinner" />
                            <p>Generating receipt...</p>
                        </div>
                    ) : (
                        <>
                            {/* Receipt */}
                            <div id="bill-print-content" className="bpm-receipt">
                                {/* Restaurant Header */}
                                <div className="bpm-receipt-header">
                                    <h2 className="bpm-rest-name">{restaurantData?.name || 'RESTOBOARD'}</h2>
                                    <p className="bpm-rest-addr">{restaurantData?.address || 'Main Branch'}</p>
                                    <p className="bpm-rest-phone">Ph: {restaurantData?.phone || '9988776655'}</p>
                                </div>

                                {/* Bill Meta */}
                                <div className="bpm-divider-dashed" />
                                <div className="bpm-meta">
                                    <div className="bpm-meta-row">
                                        <span className="bpm-meta-label">Bill No</span>
                                        <span className="bpm-meta-val">{billData?.bill_number}</span>
                                    </div>
                                    <div className="bpm-meta-row">
                                        <span className="bpm-meta-label">Date</span>
                                        <span className="bpm-meta-val">{formatDate(billData?.createdAt)}</span>
                                    </div>
                                    <div className="bpm-meta-row">
                                        <span className="bpm-meta-label">Time</span>
                                        <span className="bpm-meta-val">{formatTime(billData?.createdAt)}</span>
                                    </div>
                                    <div className="bpm-meta-row">
                                        <span className="bpm-meta-label">Payment</span>
                                        <span className="bpm-meta-val bpm-pay-badge">{formatPaymentMethod(paymentModes)}</span>
                                    </div>
                                </div>
                                <div className="bpm-divider-dashed" />

                                {/* Items */}
                                <div className="bpm-items-header">
                                    <span>ITEM</span>
                                    <span>QTY</span>
                                    <span>AMT</span>
                                </div>
                                <div className="bpm-items-list">
                                    {billData?.items?.map((item, idx) => (
                                        <div key={idx} className="bpm-item-row">
                                            <span className="bpm-item-name">{item.name}</span>
                                            <span className="bpm-item-qty">×{item.quantity}</span>
                                            <span className="bpm-item-amt">₹{item.total_price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="bpm-divider-solid" />
                                <div className="bpm-totals">
                                    <div className="bpm-total-row">
                                        <span>Subtotal</span>
                                        <span>₹{billData?.sub_total?.toFixed(2)}</span>
                                    </div>
                                    {billData?.tax_amount > 0 && (
                                        <div className="bpm-total-row">
                                            <span>Tax</span>
                                            <span>₹{billData?.tax_amount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="bpm-grand-total-row">
                                        <span>TOTAL</span>
                                        <span>₹{billData?.grand_total?.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Thank You */}
                                <div className="bpm-thankyou">
                                    <span>★</span> Thank You! Visit Again <span>★</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bpm-actions">
                                <button className="bpm-print-btn" onClick={handlePrint}>
                                    <Printer size={18} /> Print Receipt
                                </button>
                                <button className="bpm-done-btn" onClick={onClose}>
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .bpm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.65);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    padding: 1rem;
                    animation: bpmFadeIn 0.25s ease;
                }

                @keyframes bpmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .bpm-modal {
                    background: #ffffff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 420px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1);
                    animation: bpmSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }

                @keyframes bpmSlideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Header */
                .bpm-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                }

                .bpm-header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .bpm-success-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: #dcfce7;
                    color: #16a34a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 0 0 4px #bbf7d0;
                }

                .bpm-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                    line-height: 1.2;
                }

                .bpm-subtitle {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 600;
                }

                .bpm-close-btn {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .bpm-close-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                    color: #fff;
                }

                /* Body */
                .bpm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }

                /* Loading */
                .bpm-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 3rem;
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .bpm-spinner {
                    animation: spin 1s linear infinite;
                    color: #7ea1c4;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Receipt Styles */
                .bpm-receipt {
                    background: #fafafa;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 1.5rem 1.25rem;
                    font-family: 'Inter', -apple-system, sans-serif;
                    color: #1e293b;
                }

                .bpm-receipt-header {
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .bpm-rest-name {
                    font-size: 1.1rem;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                    text-transform: uppercase;
                }

                .bpm-rest-addr {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin: 2px 0;
                }

                .bpm-rest-phone {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin: 2px 0;
                }

                .bpm-divider-dashed {
                    border: none;
                    border-top: 1.5px dashed #cbd5e1;
                    margin: 0.75rem 0;
                }

                .bpm-divider-solid {
                    border: none;
                    border-top: 1.5px solid #cbd5e1;
                    margin: 0.75rem 0;
                }

                /* Bill Meta */
                .bpm-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .bpm-meta-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bpm-meta-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .bpm-meta-val {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .bpm-pay-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                }

                /* Items */
                .bpm-items-header {
                    display: grid;
                    grid-template-columns: 1fr 40px 80px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #94a3b8;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }

                .bpm-items-header span:last-child,
                .bpm-item-amt {
                    text-align: right;
                }

                .bpm-item-row {
                    display: grid;
                    grid-template-columns: 1fr 40px 80px;
                    align-items: center;
                    padding: 5px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .bpm-item-name {
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: #1e293b;
                }

                .bpm-item-qty {
                    font-size: 0.78rem;
                    color: #64748b;
                    font-weight: 600;
                    text-align: center;
                }

                .bpm-item-amt {
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                /* Totals */
                .bpm-totals {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .bpm-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: #64748b;
                }

                .bpm-grand-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1rem;
                    font-weight: 900;
                    color: #0f172a;
                    background: #0f172a;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 8px;
                    margin-top: 4px;
                }

                /* Thank You */
                .bpm-thankyou {
                    text-align: center;
                    margin-top: 1rem;
                    font-size: 0.75rem;
                    color: #64748b;
                    font-style: italic;
                    letter-spacing: 0.5px;
                }

                /* Actions */
                .bpm-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .bpm-print-btn {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px;
                    background: #0f172a;
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bpm-print-btn:hover {
                    background: #1e293b;
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
                    transform: translateY(-1px);
                }

                .bpm-done-btn {
                    flex: 1;
                    padding: 14px;
                    background: #f8fafc;
                    color: #475569;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bpm-done-btn:hover {
                    background: #e2e8f0;
                    border-color: #cbd5e1;
                }

                /* Mobile */
                @media (max-width: 480px) {
                    .bpm-modal {
                        border-radius: 16px;
                        max-height: 95vh;
                    }

                    .bpm-header {
                        padding: 1rem;
                    }

                    .bpm-body {
                        padding: 1rem;
                    }

                    .bpm-receipt {
                        padding: 1rem;
                    }

                    .bpm-actions {
                        flex-direction: column;
                    }

                    .bpm-print-btn,
                    .bpm-done-btn {
                        width: 100%;
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BillPreviewModal;