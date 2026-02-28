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
    Cpu
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
        initial: { opacity: 0, y: 60 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    };

    const features = [
        {
            title: "Neural POS Engine",
            desc: "A lightning-fast interface built on high-performance architecture for zero-latency operations.",
            icon: <Zap size={32} />,
            color: "#60a5fa"
        },
        {
            title: "Omnichannel Flow",
            desc: "Synchronize dine-in, delivery, and self-service channels through a single, unified brain.",
            icon: <Layers size={32} />,
            color: "#f472b6"
        },
        {
            title: "Predictive Analytics",
            desc: "Convert raw transaction data into actionable growth strategies with built-in intelligence.",
            icon: <BarChart3 size={32} />,
            color: "#fbbf24"
        }
    ];

    return (
        <div className="landing-page">
            {/* Mesmerizing Background Animation */}
            <div className="animated-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            {/* Premium Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="flex items-center gap-4 no-underline">
                        <div className="bg-white p-2.5 rounded-2xl shadow-2xl" style={{ display: 'flex' }}>
                            <Utensils className="w-6 h-6 text-galaxy-black" />
                        </div>
                        <span className="logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </Link>
                    <div className="flex items-center gap-10">
                        <div className="hidden lg:flex gap-10">
                            <Link to="/" className="nav-link">Platform</Link>
                            <Link to="/features" className="nav-link">Ecosystem</Link>
                            <Link to="/pricing" className="nav-link">Enterprise</Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="nav-link">Sign In</Link>
                            <Link to="/register" className="btn-primary" style={{
                                padding: '0.8rem 2.5rem',
                                borderRadius: '16px',
                                background: 'white',
                                color: 'black',
                                fontWeight: 900
                            }}>Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* High-Impact Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div {...fadeInUp}>
                        <div className="feature-tag">
                            <Cpu size={16} /> Autonomous Restaurant Infrastructure
                        </div>
                        <h1 className="hero-title">
                            The future of dining,<br />
                            engineered today.
                        </h1>
                        <p className="hero-subtitle">
                            RestoSaaS is a sophisticated multi-tenant ecosystem built to handle the complexity of modern restaurant operations with biological ease.
                        </p>
                        <div className="flex gap-6 justify-center" style={{ flexWrap: 'wrap' }}>
                            <Link to="/register" className="cta-btn flex items-center gap-4 no-underline">
                                Deploy Workspace <ArrowRight size={24} />
                            </Link>
                            <button className="btn-outline py-5 px-10 text-xl" style={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                borderRadius: '20px'
                            }}>
                                Explore Ecosystem
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, rotateX: 20, scale: 0.9 }}
                        whileInView={{ opacity: 1, rotateX: 10, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="hero-image-wrapper"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=80&w=1200"
                            alt="RestoSaaS Professional Dashboard"
                            className="hero-image"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Advanced Capabilities Section */}
            <section className="features-section">
                <div className="max-w-7xl mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-24">
                        <span className="text-primary-500 font-black uppercase tracking-[0.3em] text-sm">Architecture</span>
                        <h2 className="text-6xl font-black text-white mt-6 mb-8 tracking-tighter">Beyond POS.</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-xl leading-relaxed">We don't just process orders; we manage the entire neural tissue of your business.</p>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-10">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                {...fadeInUp}
                                transition={{ delay: i * 0.15 + 0.2 }}
                                className="feature-card"
                            >
                                <div className="feature-icon-wrapper" style={{ color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Logic & Workflow Section */}
            <section className="how-it-works">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-24">
                        <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">Seamless Onboarding.</h2>
                    </motion.div>

                    <div className="flex flex-col gap-10">
                        {[
                            { title: "Define Neural Profile", desc: "Configure your restaurant's DNA with multi-outlet hierarchy and intelligent menu mapping." },
                            { title: "Zero-Latency Deploy", desc: "Instantly activate specialized terminal nodes for self-service or elite table dining." },
                            { title: "Scale with Intelligence", desc: "Start receiving traffic and let our engine optimize your revenue streams automatically." }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                {...fadeInUp}
                                transition={{ delay: i * 0.2 }}
                                className="step-card"
                            >
                                <div className="step-number">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-white mb-3 tracking-tight">{step.title}</h4>
                                    <p className="text-slate-400 text-xl">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Conversion Section */}
            <section className="cta-section">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="cta-banner"
                >
                    <h2 className="text-6xl font-black text-white mb-8 tracking-tighter">Join the elite.</h2>
                    <p className="text-slate-400 mb-16 text-2xl max-w-2xl mx-auto">Elevate your brand with the most sophisticated restaurant operating system ever built.</p>
                    <div>
                        <Link to="/register" className="cta-btn no-underline">
                            Activate Your Workspace
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Premium Footer */}
            <footer className="footer">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-2xl" style={{ display: 'flex' }}>
                            <Utensils className="w-8 h-8 text-black" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-white">Resto<span className="text-primary-500">SaaS</span></span>
                    </div>
                    <div className="flex gap-12 text-slate-500 font-bold text-lg">
                        <span className="hover:text-white cursor-pointer transition-colors">Safety</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Open Source</span>
                    </div>
                    <div className="text-slate-600 font-bold">
                        © 2026 RestoSaaS Labs. Engineered for Performance.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

