
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 shadow-xl backdrop-blur-sm ${className}`}>
        {children}
    </div>
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string; className?: string }> = ({ title, subtitle, className = '' }) => (
    <div className={`mb-6 ${className}`}>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
);

export const Input: React.FC<{ label?: string; value: any; onChange: (e: any) => void; type?: string; placeholder?: string; rows?: number; name?: string; disabled?: boolean; className?: string; }> = ({ label, value, onChange, type = 'text', placeholder, rows, name, disabled, className = '' }) => (
    <div className="mb-4">
        {label && <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">{label}</label>}
        {rows ? (
            <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} disabled={disabled} className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} />
        ) : (
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} />
        )}
    </div>
);

export const Select: React.FC<{ label?: string; value: string; onChange: (e: any) => void; options: { value: string; label: string }[]; disabled?: boolean; className?: string; }> = ({ label, value, onChange, options, disabled, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        {label && <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">{label}</label>}
        <select value={value} onChange={onChange} disabled={disabled} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

export const Button: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string; variant?: 'primary' | 'secondary' | 'danger' }> = ({ onClick, disabled, children, className = '', variant = 'primary' }) => {
    const variants = {
        primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        {message && <p className="mt-4 text-slate-400 font-medium animate-pulse">{message}</p>}
    </div>
);
