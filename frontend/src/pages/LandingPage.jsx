import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Utensils,
    Zap,
    ArrowRight,
    Star,
    Layers,
    ShieldCheck,
    Cpu,
    CheckCircle2,
    Users
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeInUp = {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <div className="landing-page">
            {/* Creative Geometric Background */}
            <div className="bg-geometric">
                <div className="shape shape-1"></div>
            </div>

            {/* Professional Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="flex items-center gap-4 no-underline">
                        <div className="bg-primary-500 p-2.5 rounded-2xl shadow-xl shadow-primary-500/10" style={{ display: 'flex' }}>
                            <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <span className="logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </Link>
                    <div className="flex items-center gap-12">
                        <div className="hidden lg:flex gap-10">
                            <Link to="/" className="nav-link no-underline">Solution</Link>
                            <Link to="/features" className="nav-link no-underline">Network</Link>
                            <Link to="/pricing" className="nav-link no-underline">Enterprise</Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="nav-link no-underline font-extrabold" style={{ color: 'var(--galaxy-black)' }}>Sign In</Link>
                            <Link to="/register" className="btn-primary no-underline" style={{
                                padding: '0.9rem 2.25rem',
                                borderRadius: '14px',
                                boxShadow: '0 15px 30px -10px rgba(126, 161, 196, 0.4)'
                            }}>Initialize</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Creative Split Hero Section */}
            <section className="hero-section">
                <div className="hero-grid">
                    <motion.div {...fadeInUp} className="hero-content">
                        <div className="badge-creative">
                            <ShieldCheck size={16} /> Verified Enterprise Infrastructure
                        </div>
                        <h1 className="hero-title">
                            Professional Scale <br />
                            <span className="text-accent">Simplified.</span>
                        </h1>
                        <p className="hero-subtitle">
                            The definitive modular OS for high-growth restaurants. Manage global franchise operations with precision, speed, and real-time intelligence.
                        </p>
                        <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn-primary no-underline flex items-center gap-4 py-5 px-10 text-xl" style={{ borderRadius: '20px' }}>
                                Start Free Trial <ArrowRight size={24} />
                            </Link>
                            <button className="btn-outline py-5 px-10 text-xl font-bold" style={{ borderRadius: '20px', color: 'var(--galaxy-black)', borderColor: 'var(--border-light)' }}>
                                View Ecosystem
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} /> No CC Required</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} /> Instant Setup</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-visuals"
                    >
                        <div className="visual-card">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
                                alt="Analytics Dashboard"
                                style={{ width: '100%', borderRadius: '32px' }}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Dashboard Insights - Detailed View */}
            <section className="dashboard-insights">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="insights-grid">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="insights-display"
                        >
                            <img
                                src="/restosaas_dashboard_preview_1772285378104.png"
                                alt="RestoSaaS Dashboard Mockup"
                                className="dashboard-mockup-img"
                            />
                            <div className="display-glow"></div>
                        </motion.div>

                        <motion.div {...fadeInUp} className="insights-content">
                            <div className="badge-outline">Operational Intelligence</div>
                            <h2 className="section-title">One Brain. <br /><span className="text-primary-500">Every Operation.</span></h2>
                            <p className="section-desc">
                                Stop juggling spreadsheets. Our unified dashboard transforms raw operational data into high-precision visualizations, allowing you to monitor sales, inventory, and staff efficiency in real-time.
                            </p>

                            <div className="insight-features">
                                {[
                                    { title: "Universal Sync", desc: "Real-time data flow across all terminal nodes." },
                                    { title: "Predictive Analytics", desc: "AI-driven insights for demand forecasting." },
                                    { title: "Global Controls", desc: "Manage menu and pricing across all franchises." }
                                ].map((item, i) => (
                                    <div key={i} className="insight-item">
                                        <div className="insight-dot"></div>
                                        <div>
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Capabilities Section */}
            <section className="features-section">
                <div className="max-w-7xl mx-auto px-8">
                    <motion.div {...fadeInUp} className="text-center">
                        <span className="text-primary-500 font-black uppercase tracking-[0.3em] text-sm">Capabilities</span>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mt-6 mb-8 tracking-tighter">Modular Growth Strategy.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed">The architecture of high-performance hospitality is modular. Active only the components your operation requires.</p>
                    </motion.div>

                    <div className="features-grid">
                        {[
                            { title: "Smart Billing", desc: "Process transactions with high-speed POS terminals and multiple payment gateways.", icon: <Zap size={32} /> },
                            { title: "Inventory Precision", desc: "Live-tracking of stock nodes with automated low-stock critical alerts.", icon: <Layers size={32} /> },
                            { title: "Enterprise Reports", desc: "Deep-dive financial and operational reports generated in seconds.", icon: <BarChart3 size={32} /> },
                            { title: "Granular Access", desc: "Total control over staff page-level and feature-level permissions.", icon: <ShieldCheck size={32} /> },
                            { title: "Menu Architect", desc: "Define categories, products, and variants with enterprise precision.", icon: <Cpu size={32} /> },
                            { title: "Staff Network", desc: "Maintain a high-performance roster with specialized credential security.", icon: <Users size={32} /> }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                {...fadeInUp}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                className="feature-card"
                            >
                                <div className="feature-icon-box">
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted Network Section */}
            <section className="trust-section">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="trust-box">
                        <div className="trust-col">
                            <span className="trust-number">500+</span>
                            <span className="trust-label">Global Franchises</span>
                        </div>
                        <div className="trust-col">
                            <span className="trust-number">45M+</span>
                            <span className="trust-label">Orders Processed</span>
                        </div>
                        <div className="trust-col">
                            <span className="trust-number">99.9%</span>
                            <span className="trust-label">Network Uptime</span>
                        </div>
                        <div className="trust-col">
                            <span className="trust-number">24/7</span>
                            <span className="trust-label">Dev Ops Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="cta-container"
                    >
                        <div className="cta-glow"></div>
                        <h2 className="cta-title">Scale with Confidence.</h2>
                        <p className="text-slate-400 mb-16 text-2xl max-w-2xl mx-auto">Join the ranks of high-performance restaurants transforming their operations with RestoSaaS.</p>
                        <div>
                            <Link to="/register" className="btn-primary-white">
                                Activate Your Profile
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Professional Footer */}
            <footer className="footer">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-primary-500 p-2 rounded-2xl" style={{ display: 'flex' }}>
                                    <Utensils className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-3xl font-black tracking-tighter text-slate-900">Resto<span className="text-primary-500">SaaS</span></span>
                            </div>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                RestoSaaS is the definitive enterprise operating system for the modern hospitality industry. Scaling excellence through modular innovation.
                            </p>
                            <div className="flex gap-4">
                                <div className="social-pill"><Link to="/" className="no-underline text-xl">X</Link></div>
                                <div className="social-pill"><Link to="/" className="no-underline text-xl">In</Link></div>
                            </div>
                        </div>

                        <div className="footer-nav-col">
                            <h4>Solution</h4>
                            <Link to="/" className="footer-link">Dashboard Intelligence</Link>
                            <Link to="/" className="footer-link">Modular Inventory</Link>
                            <Link to="/" className="footer-link">Staff Architecture</Link>
                            <Link to="/" className="footer-link">POS Integration</Link>
                        </div>

                        <div className="footer-nav-col">
                            <h4>Platform</h4>
                            <Link to="/" className="footer-link">Security Matrix</Link>
                            <Link to="/" className="footer-link">Global Network</Link>
                            <Link to="/" className="footer-link">API Access</Link>
                            <Link to="/" className="footer-link">Status Center</Link>
                        </div>

                        <div className="footer-nav-col">
                            <h4>Corporate</h4>
                            <Link to="/" className="footer-link">Terms of Service</Link>
                            <Link to="/" className="footer-link">Privacy Protocol</Link>
                            <Link to="/" className="footer-link">Cookie Policy</Link>
                            <Link to="/" className="footer-link">Contact Support</Link>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="text-slate-400 font-bold">
                            © 2026 RestoSaaS Operations Center. All Rights Reserved.
                        </div>
                        <div className="text-slate-400 font-black tracking-widest uppercase text-xs">
                            Built for professional scale.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

