import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Utensils,
    Zap,
    ArrowRight,
    Star
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeIn = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }
    };

    const features = [
        {
            title: "Quick-Service Kiosk",
            desc: "Empower customers with high-speed ordering terminals designed for rapid efficiency.",
            icon: <Zap size={28} />,
            color: "#7ea1c4"
        },
        {
            title: "Table Side Dining",
            desc: "Full-service management including KOT, complex billing, and live table occupancy tracking.",
            icon: <Utensils size={28} />,
            color: "#fca5a5"
        },
        {
            title: "Insight Analytics",
            desc: "Visualise your restaurant's growth with real-time sales data and inventory intelligence.",
            icon: <BarChart3 size={28} />,
            color: "#fbbf24"
        }
    ];

    return (
        <div className="landing-page">
            {/* Background Decorative Blobs */}
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''} `}>
                <div className="nav-container">
                    <Link to="/" className="flex items-center gap-3 no-underline">
                        <div className="bg-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/20" style={{ display: 'flex' }}>
                            <Utensils className="w-5 h-5 text-galaxy" />
                        </div>
                        <span className="logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </Link>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex gap-8">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/features" className="nav-link">Features</Link>
                            <Link to="/pricing" className="nav-link">Pricing</Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="btn-primary" style={{ padding: '0.65rem 1.75rem' }}>Join Now</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-container grid">
                    <motion.div {...fadeIn}>
                        <div className="feature-tag">
                            <Star size={14} fill="currentColor" /> Multi-Tenant POS Platform
                        </div>
                        <h1 className="hero-title">
                            The Operating System <br />
                            <span className="text-primary-500">for Modern Restaurants.</span>
                        </h1>
                        <p className="hero-subtitle">
                            RestoSaaS is a modular, high-performance POS platform designed for scale. Manage single outlets or global franchises with unparalleled speed and biological simplicity.
                        </p>
                        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn-primary flex items-center gap-3 py-4 px-8 text-lg">
                                Get Started Free <ArrowRight size={20} />
                            </Link>
                            <button className="btn-outline py-4 px-8 text-lg">Watch Ecosystem Tour</button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 40 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="hero-image-container"
                    >
                        <div className="hero-image-glow"></div>
                        <img
                            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800"
                            alt="RestoSaaS Dashboard"
                            className="hero-image"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="max-w-7xl mx-auto">
                    <motion.div {...fadeIn} className="text-center mb-16">
                        <span className="text-primary-500 font-bold uppercase tracking-widest text-sm">Capabilities</span>
                        <h2 className="text-5xl font-bold text-galaxy mt-4 mb-6">Engineered for Excellence</h2>
                        <p className="text-galaxy-secondary max-w-2xl mx-auto text-lg">Our suite of tools eliminates friction from every touchpoint of your restaurant's lifecycle.</p>
                    </motion.div>

                    <div className="features-grid grid">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                {...fadeIn}
                                transition={{ delay: i * 0.15 }}
                                className="feature-card"
                            >
                                <div className="feature-icon-wrapper" style={{ color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p className="text-galaxy-secondary leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <div className="steps-container">
                    <motion.div {...fadeIn} className="text-center mb-20">
                        <h2 className="text-5xl font-bold text-galaxy mb-4">Three Steps to Scale</h2>
                    </motion.div>

                    <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {[
                            { title: "Define Your Space", desc: "Create your restaurant profile with advanced multi-tier configuration." },
                            { title: "Select Your Interface", desc: "Deploy specialized self-service or table-side terminals instantly." },
                            { title: "Activate Growth", desc: "Start processing orders and watch your data transform into revenue." }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                {...fadeIn}
                                transition={{ delay: i * 0.2 }}
                                className="step-card"
                            >
                                <div className="step-number">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-galaxy mb-2">{step.title}</h4>
                                    <p className="text-galaxy-secondary text-lg">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="cta-banner"
                >
                    <div className="cta-glow-1"></div>
                    <div className="cta-glow-2"></div>

                    <h2 className="text-5xl font-bold text-white mb-6 relative z-10">Scale your restaurant to infinity.</h2>
                    <p className="text-white opacity-80 mb-12 text-xl relative z-10">Start your journey with the world's most modular POS ecosystem.</p>
                    <div className="relative z-10">
                        <Link to="/register" className="cta-btn">
                            Create Free Workspace <ArrowRight size={24} />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500 p-2 rounded-xl" style={{ display: 'flex' }}>
                            <Utensils className="w-5 h-5 text-galaxy" />
                        </div>
                        <span className="text-2xl font-bold tracking-tighter text-galaxy">Resto<span className="text-primary-500">SaaS</span></span>
                    </div>
                    <div className="flex gap-8 text-galaxy-muted font-medium">
                        <span>Status</span>
                        <span>Terms</span>
                        <span>Privacy</span>
                        <span>Security</span>
                    </div>
                    <div className="text-galaxy-muted text-sm font-medium">
                        © 2026 RestoSaaS Platform. Built with Precision.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

