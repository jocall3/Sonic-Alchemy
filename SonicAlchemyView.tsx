
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
    Composition, UserProfile, UserStats, AppSettings, 
    Transaction, Alert, AgentAction, AgentMessage, Project 
} from './types';
import { 
    Card, SectionHeader, Input, Select, Button, Modal, LoadingSpinner 
} from './components';
import { 
    digitalIdentityService, programmableTokenRailService, 
    monitoringAgent, remediationAgent, orchestrationAgent, 
    agentMessagingLayer, addAuditLogEntry, getAuditLog, delay 
} from './services';
import { useNotifications } from './App';

const MOCK_USER: UserProfile = {
    id: 'user-777',
    username: 'AlchemistPrime',
    email: 'prime@sonicalchemy.io',
    avatarUrl: 'https://picsum.photos/seed/sonic/200/200',
    bio: 'Pioneering the intersection of neural networks and sonic architecture.',
    memberSince: '2024-01-01',
    preferredGenre: 'Ambient',
    preferredInstruments: ['Synthesizer', 'Neural Pad'],
    allowPublicGenerations: true,
    storageUsedGB: 4.5,
    maxStorageGB: 50,
    subscriptionLevel: 'Enterprise',
    lastLogin: new Date().toISOString(),
    digitalIdentityId: 'user-777'
};

const GENRES = ['Ambient', 'Cyberpunk', 'Techno', 'Cinematic', 'Lofi', 'Orchestral'];
const MOODS = ['Aggressive', 'Serene', 'Mysterious', 'Melancholic', 'Ethereal', 'Tense'];
const INSTRUMENTS = ['Neural Pad', 'Bass Pulse', 'Granular Texture', 'Piano', 'Glitch Percussion', 'Vocoder'];

const SonicAlchemyView: React.FC = () => {
    const { addNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState<'generate' | 'library' | 'finance' | 'intelligence' | 'audit'>('generate');
    const [currentUser] = useState<UserProfile>(MOCK_USER);
    const [isLoading, setIsLoading] = useState(false);
    
    // Generator State
    const [prompt, setPrompt] = useState('A sprawling, cyberpunk soundscape with deep bass pulses and shimmering textures');
    const [genre, setGenre] = useState('Cyberpunk');
    const [mood, setMood] = useState('Mysterious');
    const [tempo, setTempo] = useState(120);
    const [lastResult, setLastResult] = useState<Composition | null>(null);

    // Data State
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [balance, setBalance] = useState(0);

    // Initial Setup
    useEffect(() => {
        digitalIdentityService.registerIdentity(currentUser.id, 'user', ['composer', 'trader'], 'L3');
        programmableTokenRailService.updateBalance(currentUser.id, 'SA-CREDIT-ID', 50000);
        setBalance(programmableTokenRailService.getBalance(currentUser.id, 'SA-CREDIT-ID'));
        
        addAuditLogEntry(currentUser.id, 'session.init', { version: '1.0.0-PRO' }, digitalIdentityService.getPrivateKey(currentUser.id));
    }, [currentUser.id]);

    // Financial Polling
    useEffect(() => {
        const interval = setInterval(() => {
            setBalance(programmableTokenRailService.getBalance(currentUser.id, 'SA-CREDIT-ID'));
            setAlerts(monitoringAgent.getAlerts());
        }, 2000);
        return () => clearInterval(interval);
    }, [currentUser.id]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        addNotification({ type: 'info', message: 'Initiating neural composition engine...' });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const finalPrompt = `
                Role: Music Composer AI
                User Request: ${prompt}
                Params: Genre: ${genre}, Mood: ${mood}, Target Tempo: ${tempo}BPM
                Output Requirement: JSON with title, description, instrumentation (array), suggestedDuration (number), keySignature.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: finalPrompt,
                config: { responseMimeType: 'application/json' }
            });

            const data = JSON.parse(response.text);
            
            // Simulate audio generation latency
            await delay(3000);

            const newComp: Composition = {
                id: Math.random().toString(36).substring(7),
                userId: currentUser.id,
                title: data.title,
                description: data.description,
                instrumentation: data.instrumentation || INSTRUMENTS.slice(0, 3),
                genre, mood, tempo,
                keySignature: data.keySignature || 'C Minor',
                durationSeconds: data.suggestedDuration || 180,
                audioUrl: `https://api.sonicalchemy.io/stream/${Math.random().toString(36).substring(7)}`,
                waveformJson: JSON.stringify(Array.from({ length: 100 }, () => Math.random())),
                createdAt: new Date().toISOString(),
                lastModifiedAt: new Date().toISOString(),
                isPublic: true,
                tags: [genre, mood],
                versionHistory: [],
                likes: 0,
                comments: [],
                playCount: 0,
                downloadCount: 0,
                modelUsed: 'gemini-3-flash-preview',
                originalPrompt: prompt,
                generationParameters: {
                    genre, mood, tempoRange: [tempo-10, tempo+10], instrumentationPreference: [], durationPreference: [120, 240],
                    keySignaturePreference: 'Any', creativityTemperature: 0.8, diversityPenalty: 0.5, model: 'G3', outputFormat: 'audio'
                }
            };

            setLastResult(newComp);
            setCompositions(prev => [newComp, ...prev]);
            addNotification({ type: 'success', message: 'Composition synthesized successfully!' });
            addAuditLogEntry(currentUser.id, 'composition.synthesized', { id: newComp.id, title: newComp.title }, digitalIdentityService.getPrivateKey(currentUser.id));

        } catch (err: any) {
            addNotification({ type: 'error', message: `Engine error: ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async (dest: string, amount: number) => {
        if (!dest || amount <= 0) return;
        const tx = programmableTokenRailService.transferTokens(currentUser.id, currentUser.id, dest, 'SA-CREDIT-ID', amount);
        if (tx) {
            setTransactions(prev => [tx, ...prev]);
            addNotification({ type: 'success', message: `Transferred ${amount} SAC to ${dest}` });
            monitoringAgent.observe({ type: 'tx', riskScore: tx.riskScore });
            addAuditLogEntry(currentUser.id, 'transaction.transfer', { to: dest, amount }, digitalIdentityService.getPrivateKey(currentUser.id));
        } else {
            addNotification({ type: 'error', message: 'Insufficient SAC balance.' });
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase">Sonic Alchemy</h1>
                </div>

                <nav className="flex-col flex gap-2 flex-1">
                    <NavItem icon="M12 4v16m8-8H4" label="Synthesizer" active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} />
                    <NavItem icon="M5 8h14M5 12h14M5 16h14" label="Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
                    <NavItem icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Finance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
                    <NavItem icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" label="Intelligence" active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} />
                    <NavItem icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
                </nav>

                <div className="mt-auto bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3">
                        <img src={currentUser.avatarUrl} className="h-10 w-10 rounded-full border border-cyan-500/50" />
                        <div>
                            <p className="text-sm font-bold text-white leading-none">{currentUser.username}</p>
                            <p className="text-[10px] text-cyan-400 mt-1 uppercase font-bold tracking-widest">{currentUser.subscriptionLevel}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 bg-slate-950">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'generate' && (
                        <div className="space-y-8">
                            <SectionHeader title="Neural Synthesis" subtitle="Harness Gemini to generate structured musical compositions." />
                            <Card className="p-8">
                                <div className="space-y-6">
                                    <Input label="Composition Prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="Describe the sonic atmosphere..." />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select label="Genre" value={genre} onChange={e => setGenre(e.target.value)} options={GENRES.map(g => ({ value: g, label: g }))} />
                                        <Select label="Mood" value={mood} onChange={e => setMood(e.target.value)} options={MOODS.map(m => ({ value: m, label: m }))} />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Tempo: {tempo} BPM</label>
                                            <input type="range" min="60" max="180" value={tempo} onChange={e => setTempo(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                        </div>
                                        <Button onClick={handleGenerate} disabled={isLoading} className="min-w-[200px] py-4">
                                            {isLoading ? 'Synthesizing...' : 'Generate Piece'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {isLoading && <LoadingSpinner message="Architecting neural waveforms..." />}

                            {lastResult && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <CompositionCard composition={lastResult} isNew />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'library' && (
                        <div className="space-y-8">
                            <SectionHeader title="Your Sonic Vault" subtitle="Archive of all synthesized neural assets." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {compositions.map(c => <CompositionCard key={c.id} composition={c} />)}
                                {compositions.length === 0 && <p className="text-slate-500 italic">No compositions found in vault.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="space-y-8">
                            <SectionHeader title="Programmable Finance" subtitle="Manage your SAC tokens and audit cross-rail settlement." />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <h3 className="text-lg font-bold text-white mb-4">Atomic Transfer</h3>
                                    <div className="space-y-4">
                                        <Input label="Recipient Digital ID" placeholder="agent-remediation-001 or user-uuid..." value="" onChange={() => {}} />
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <Input label="Amount (SAC)" type="number" placeholder="0.00" value={100} onChange={() => {}} />
                                            </div>
                                            <Button onClick={() => handleTransfer('agent-remediation-001', 100)} className="mb-4">Execute Settlement</Button>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="bg-gradient-to-br from-cyan-900/40 to-slate-900 border-cyan-500/30">
                                    <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Vault Balance</p>
                                    <h2 className="text-4xl font-black text-white">{balance.toLocaleString()} <span className="text-lg font-normal text-slate-400">SAC</span></h2>
                                    <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-3">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Active Rails</span>
                                            <span className="text-emerald-400">2 Connected</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Risk Rating</span>
                                            <span className="text-white font-bold">A+ Excellent</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card>
                                <h3 className="text-lg font-bold text-white mb-6">Recent Ledger Activity</h3>
                                <div className="space-y-4">
                                    {transactions.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                                                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Transfer to {tx.destinationAccountId?.substring(0, 8)}...</p>
                                                    <p className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">-{tx.amount} SAC</p>
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase">Success</p>
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-slate-500 italic text-center py-4">No recent transactions recorded.</p>}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'intelligence' && (
                        <div className="space-y-8">
                            <SectionHeader title="Agent Intelligence Layer" subtitle="Autonomous agents monitoring system integrity and security." />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AgentStatusCard agent={monitoringAgent} status="Scanning" />
                                <AgentStatusCard agent={remediationAgent} status="Idle" />
                                <AgentStatusCard agent={orchestrationAgent} status="Coordinating" />
                            </div>

                            <Card className="border-rose-500/30">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                                    Active Anomalies & Threats
                                </h3>
                                <div className="space-y-4">
                                    {alerts.map(a => (
                                        <div key={a.id} className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-rose-200">{a.message}</p>
                                                <p className="text-xs text-rose-400/60 mt-1">Detected by {a.source} at {new Date(a.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest">{a.severity}</span>
                                        </div>
                                    ))}
                                    {alerts.length === 0 && (
                                        <div className="flex flex-col items-center py-10 opacity-40">
                                            <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            <p className="mt-4 text-sm">Security perimeter verified. No active threats.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="space-y-8">
                            <SectionHeader title="Immutable Audit Chain" subtitle="Cryptographically verified historical system events." />
                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                                                <th className="py-4 px-2">Timestamp</th>
                                                <th className="py-4 px-2">Event Type</th>
                                                <th className="py-4 px-2">Entity</th>
                                                <th className="py-4 px-2">Block Hash</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {getAuditLog().slice().reverse().map(log => (
                                                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                                    <td className="py-4 px-2 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                    <td className="py-4 px-2"><span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md font-mono text-xs">{log.eventType}</span></td>
                                                    <td className="py-4 px-2 font-semibold text-white">{log.entityId}</td>
                                                    <td className="py-4 px-2 font-mono text-[10px] text-cyan-400/60">{log.hash.substring(0, 16)}...</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
            
            {/* Playback Control Bar (Fixed) */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900 border-t border-slate-800 z-50 px-8 flex items-center justify-between">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                        <svg className="h-6 w-6 text-cyan-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{lastResult?.title || "No track selected"}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{lastResult?.genre || "---"}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="flex items-center gap-6">
                        <button className="text-slate-500 hover:text-white transition-colors">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z" /></svg>
                        </button>
                        <button className="h-10 w-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-white/10">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        </button>
                        <button className="text-slate-500 hover:text-white transition-colors">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z" transform="rotate(180 12 12)" /></svg>
                        </button>
                    </div>
                    <div className="w-full max-w-md h-1 bg-slate-800 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-cyan-500 w-1/3" />
                    </div>
                </div>

                <div className="w-1/3 flex justify-end gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        <div className="w-24 h-1 bg-slate-800 rounded-full relative">
                            <div className="absolute inset-y-0 left-0 bg-slate-400 w-3/4 rounded-full" />
                        </div>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
        <svg className={`h-5 w-5 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
        <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
);

const CompositionCard: React.FC<{ composition: Composition; isNew?: boolean }> = ({ composition, isNew }) => (
    <Card className={`${isNew ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : ''} overflow-hidden group`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h4 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">{composition.title}</h4>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mt-1">{composition.genre} • {composition.tempo}BPM</p>
            </div>
            {isNew && <span className="bg-cyan-500 text-black text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">New Synthesis</span>}
        </div>
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6">{composition.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
            {composition.instrumentation.map(inst => (
                <span key={inst} className="px-2.5 py-1 bg-slate-900 border border-slate-700/50 rounded-md text-[10px] font-bold text-slate-300 uppercase tracking-wider">{inst}</span>
            ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex gap-4">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Duration</p>
                    <p className="text-xs text-white font-bold">{Math.floor(composition.durationSeconds / 60)}:{(composition.durationSeconds % 60).toString().padStart(2, '0')}</p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Key</p>
                    <p className="text-xs text-white font-bold">{composition.keySignature}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
                <button className="p-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-all text-white shadow-lg shadow-cyan-900/20 active:scale-90">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
            </div>
        </div>
    </Card>
);

const AgentStatusCard: React.FC<{ agent: any; status: string }> = ({ agent, status }) => (
    <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="h-10 w-10 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
                <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Online</span>
        </div>
        <div>
            <h4 className="text-white font-bold">{agent.name}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{agent.id}</p>
        </div>
        <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">{status}</span>
            <div className="flex gap-1">
                <span className="h-1 w-1 bg-cyan-400 rounded-full animate-ping" />
                <span className="h-1 w-1 bg-cyan-400 rounded-full" />
            </div>
        </div>
    </Card>
);

export default SonicAlchemyView;
