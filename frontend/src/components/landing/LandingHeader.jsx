import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Workflow } from 'lucide-react';

const LandingHeader = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 py-6 transition-all duration-400 ${scrolled ? 'py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <img src="/logo.jpeg" alt="Yugam Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                    <span className="text-2xl font-normal tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Yugam <span className="text-primary-500 font-bold">Software</span></span>
                </Link>
                <div className="flex items-center gap-10">
                    <div className="hidden lg:flex gap-8">
                        <Link to="/" className="text-base font-bold text-slate-600 hover:text-primary-500 transition-colors no-underline">Solution</Link>
                        <Link to="/features" className="text-base font-bold text-slate-600 hover:text-primary-500 transition-colors no-underline">Network</Link>
                        <Link to="/pricing" className="text-base font-bold text-slate-600 hover:text-primary-500 transition-colors no-underline">Enterprise</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-base font-extrabold text-slate-900 no-underline">Sign In</Link>
                        <Link to="/register" className="btn-primary no-underline px-8 py-3.5 rounded-xl text-base shadow-lg shadow-primary-500/40">
                            Initialize
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default LandingHeader;
