import React, { useState, useEffect } from 'react';
import { Printer, Download, X, CheckCircle2 } from 'lucide-react';

const BillPreviewModal = ({
    isOpen,
    onClose,
    billId,
    paymentModes
}) => {
    const [billData, setBillData] = useState(null);
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && billId) {
            fetchBillDetails();
        }
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
                if (restaurantResult.success) {
                    setRestaurantData(restaurantResult.data.restaurant);
                }
            }
        } catch (error) {
            console.error("Error fetching bill details:", error);
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
        <div className="payment-modal-overlay">
            <div className="pos-payment-modal" style={{ maxWidth: '600px', height: 'auto', maxHeight: '90vh' }}>
                <div className="pos-modal-header">
                    <div className="header-content">
                        <CheckCircle2 className="text-green-500" size={24} />
                        <h3 className="font-bold text-xl">Payment Successful</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="pos-modal-body" style={{ padding: '2rem' }}>
                    {loading ? (
                        <div className="w-full text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                            <p className="text-slate-500">Generating receipt...</p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            {/* Receipt Container */}
                            <div id="bill-print-content" style={{
                                width: '100%',
                                maxWidth: '300px',
                                background: '#fff',
                                padding: '1.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                color: '#000',
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>{restaurantData?.name || 'RESTOBOARD'}</h2>
                                    <p style={{ margin: '2px 0' }}>{restaurantData?.address || 'Main Branch'}</p>
                                    <p style={{ margin: '2px 0' }}>Ph: {restaurantData?.phone || '9988776655'}</p>
                                </div>

                                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                                    <p style={{ margin: '2px 0' }}><strong>Bill:</strong> {billData?.bill_number}</p>
                                    <p style={{ margin: '2px 0' }}><strong>Date:</strong> {formatDate(billData?.createdAt)} {formatTime(billData?.createdAt)}</p>
                                    <p style={{ margin: '2px 0' }}><strong>Pay:</strong> {formatPaymentMethod(paymentModes)}</p>
                                </div>

                                <div style={{ minHeight: '60px' }}>
                                    {billData?.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>₹{item.total_price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal:</span>
                                        <span>₹{billData?.sub_total?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                        <span>TOTAL:</span>
                                        <span>₹{billData?.grand_total?.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
                                    <p>Thank You! Visit Again.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8 w-full">
                                <button onClick={handlePrint} className="pay-btn flex-1" style={{ marginTop: 0 }}>
                                    <Printer size={20} /> Print Receipt
                                </button>
                                <button onClick={onClose} className="btn-outline flex-1 py-4 rounded-xl font-bold">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillPreviewModal;