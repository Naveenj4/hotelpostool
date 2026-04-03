import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Zap,
    ArrowRight,
    Layers,
    ShieldCheck,
    Cpu,
    CheckCircle2,
    Users
} from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingFooter from '../components/landing/LandingFooter';


const LandingPage = () => {

    const fadeInUp = {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <div>


            <LandingHeader />

            {/* Creative Split Hero Section */}
            <section className="relative pt-48 pb-32 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <motion.div {...fadeInUp} className="lg:max-w-3xl">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 text-primary-600 border border-primary-500/20 rounded-lg text-sm font-bold uppercase tracking-widest mb-10">
                            <ShieldCheck size={16} /> Verified Enterprise Infrastructure
                        </div>
                        <h1 className="text-6xl font-extrabold tracking-tighter text-slate-900 leading-tight mb-8">
                            Professional Scale <br />
                            <span className="text-primary-500">Simplified.</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed mb-14">
                            The definitive modular OS for high-growth restaurants. Manage global franchise operations with precision, speed, and real-time intelligence.
                        </p>
                        <div className="flex flex-wrap gap-6">
                            <Link to="/register" className="btn-primary no-underline flex items-center gap-4 py-5 px-10 text-xl rounded-2xl">
                                Start Free Trial <ArrowRight size={24} />
                            </Link>
                            <button className="btn-outline py-5 px-10 text-xl font-bold rounded-2xl text-slate-900 border-slate-200">
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
                        className="relative group"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full transition-transform duration-500 group-hover:scale-105">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
                                alt="Analytics Dashboard"
                                className="w-full rounded-3xl"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Dashboard Insights - Detailed View */}
            <section className="py-40 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative z-10"
                        >
                            <img
                                src="/restosaas_dashboard_preview_1772285378104.png"
                                alt="RestoSaaS Dashboard Mockup"
                                className="w-full rounded-3xl shadow-2xl border border-slate-200"
                            />
                            <div className="absolute inset-0 bg-primary-50/50 -z-10 rounded-full blur-3xl"></div>
                        </motion.div>

                        <motion.div {...fadeInUp}>
                            <div className="inline-block px-4 py-2 border border-primary-500 text-primary-500 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Operational Intelligence
                            </div>
                            <h2 className="text-5xl font-extrabold tracking-tighter text-slate-900 leading-tight my-8">
                                One Brain. <br /><span className="text-primary-500">Every Operation.</span>
                            </h2>
                            <p className="text-xl text-slate-600 leading-relaxed mb-12">
                                Stop juggling spreadsheets. Our unified dashboard transforms raw operational data into high-precision visualizations, allowing you to monitor sales, inventory, and staff efficiency in real-time.
                            </p>

                            <div className="flex flex-col gap-8">
                                {[
                                    { title: "Universal Sync", desc: "Real-time data flow across all terminal nodes." },
                                    { title: "Predictive Analytics", desc: "AI-driven insights for demand forecasting." },
                                    { title: "Global Controls", desc: "Manage menu and pricing across all franchises." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="w-3 h-3 bg-primary-500 rounded-full mt-2 shadow-[0_0_15px_rgba(126,161,196,1)]"></div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                                            <p className="text-base text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Capabilities Section */}
            <section className="py-40 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeInUp} className="text-center">
                        <span className="text-primary-500 font-black uppercase tracking-[0.3em] text-sm">Capabilities</span>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mt-6 mb-8 tracking-tighter">Modular Growth Strategy.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed">The architecture of high-performance hospitality is modular. Active only the components your operation requires.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto mt-20">
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
                                className="p-12 bg-white rounded-3xl border border-slate-200 transition-all duration-500 hover:-translate-y-4 hover:border-primary-500 hover:shadow-2xl"
                            >
                                <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-10">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-extrabold mb-5 tracking-tight">{f.title}</h3>
                                <p className="text-base text-slate-600 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted Network Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 bg-white py-24 px-16 rounded-3xl shadow-xl border border-slate-200 text-center">
                        <div>
                            <span className="block text-5xl font-extrabold text-primary-500 mb-2 tracking-tighter">500+</span>
                            <span className="text-base font-bold text-slate-500 uppercase tracking-widest">Global Franchises</span>
                        </div>
                        <div>
                            <span className="block text-5xl font-extrabold text-primary-500 mb-2 tracking-tighter">45M+</span>
                            <span className="text-base font-bold text-slate-500 uppercase tracking-widest">Orders Processed</span>
                        </div>
                        <div>
                            <span className="block text-5xl font-extrabold text-primary-500 mb-2 tracking-tighter">99.9%</span>
                            <span className="text-base font-bold text-slate-500 uppercase tracking-widest">Network Uptime</span>
                        </div>
                        <div>
                            <span className="block text-5xl font-extrabold text-primary-500 mb-2 tracking-tighter">24/7</span>
                            <span className="text-base font-bold text-slate-500 uppercase tracking-widest">Dev Ops Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="max-w-7xl mx-auto bg-slate-900 rounded-3xl p-20 text-center relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -z-1"></div>
                        <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tighter">Scale with Confidence.</h2>
                        <p className="text-slate-400 mb-12 text-2xl max-w-2xl mx-auto">Join the ranks of high-performance restaurants transforming their operations with Yugam Software.</p>
                        <div>
                            <Link to="/register" className="inline-block bg-white text-slate-900 px-14 py-5 rounded-2xl text-xl font-bold no-underline transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl">
                                Activate Your Profile
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
};

export default LandingPage;

