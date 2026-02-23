import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Utensils,
    Settings,
    Zap,
    CheckCircle2,
    ArrowRight,
    ChevronRight
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const features = [
        {
            title: "Self-Service Kiosk",
            desc: "Perfect for fast-casual and quick-service restaurants to speed up ordering.",
            icon: <Zap className="w-6 h-6 text-primary-500" />
        },
        {
            title: "Table Side Ordering",
            desc: "Complete dining experience with KOT, table management, and bill splitting.",
            icon: <Utensils className="w-6 h-6 text-primary-500" />
        },
        {
            title: "Real-time Analytics",
            desc: "Keep track of sales, inventory, and staff performance from anywhere.",
            icon: <BarChart3 className="w-6 h-6 text-primary-500" />
        }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="navbar glass-morphism">
                <div className="nav-container">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-500 p-2 rounded-lg" style={{ display: 'flex' }}>
                            <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <span className="logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="px-6 py-2 text-galaxy-secondary font-medium hover-orange transition-colors" style={{ textDecoration: 'none' }}>Login</Link>
                        <Link to="/register" className="btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-container grid">
                    <motion.div {...fadeIn}>
                        <span className="feature-tag">
                            Production-ready Restaurant POS
                        </span>
                        <h1 className="hero-title">
                            The only POS your restaurant <span className="text-primary-500">needs to grow.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Streamline your operations, manage orders, and get real-time insights with the most intuitive multi-tenant POS system.
                        </p>
                        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn-primary flex items-center gap-2">
                                Start Free Trial <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="btn-outline">Watch Demo</button>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="hero-image-glow"></div>
                        <img
                            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800"
                            alt="Dashboard Preview"
                            className="hero-image"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-galaxy mb-4">Powerful Features</h2>
                        <p className="text-galaxy-secondary max-w-2xl mx-auto">Everything you need to run your restaurant efficiently, from order to payment.</p>
                    </div>
                    <div className="features-grid grid">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="feature-card"
                            >
                                <div className="feature-icon-wrapper">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-galaxy-secondary" style={{ lineHeight: '1.6' }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <div className="steps-container">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-galaxy mb-4">How It Works</h2>
                    </div>
                    <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {[
                            "Register your restaurant with your details.",
                            "Choose your restaurant type (Self-Service or Dining).",
                            "Set up your menu and start taking orders."
                        ].map((step, i) => (
                            <div key={i} className="step-card">
                                <div className="step-number">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold mb-2">{step}</h4>
                                    <p className="text-galaxy-secondary">RestoSaaS automates the complex parts so you can focus on great food.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-banner">
                    <div className="cta-glow-1"></div>
                    <div className="cta-glow-2"></div>

                    <h2 className="text-4xl font-bold text-galaxy mb-6 relative z-10">Ready to transform your restaurant?</h2>
                    <p className="text-galaxy-secondary mb-10 text-lg relative z-10">Join 500+ restaurants that use RestoSaaS to scale their business.</p>
                    <div className="relative z-10">
                        <Link to="/register" className="cta-btn">
                            Create Your Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-500 p-2 rounded-lg" style={{ display: 'flex', padding: '0.375rem' }}>
                            <Utensils className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-galaxy">RestoSaaS</span>
                    </div>
                    <div className="text-galaxy-muted text-sm">
                        © 2026 RestoSaaS. Built for scale.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

