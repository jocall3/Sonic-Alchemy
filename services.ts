
import { v4 as uuidv4 } from 'uuid';
import { 
    DigitalIdentity, Transaction, LedgerEntry, TokenMetadata, TokenBalance, 
    ProgrammableRail, SettlementPolicy, AuditLogEntry, Alert, AgentMessage, AgentAction
} from './types';

export const generateUniqueId = (): string => uuidv4();

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const simulateGenerateKeyPair = () => ({
    publicKey: `pubkey-${uuidv4().substring(0, 8)}`,
    privateKey: `privkey-${uuidv4().substring(0, 12)}`
});

export const simulateSignData = (data: string, privateKey: string): string => {
    return `SIG-${btoa(data).substring(0, 16)}-${privateKey.substring(0, 8)}`;
};

export const simulateVerifySignature = (data: string, signature: string, publicKey: string): boolean => {
    const expectedPrefix = `SIG-${btoa(data).substring(0, 16)}`;
    return signature.startsWith(expectedPrefix) && signature.includes(publicKey.substring(0, 8));
};

// --- AUDIT LOG SERVICE ---
let currentAuditLog: AuditLogEntry[] = [];
let lastAuditHash = 'genesis_hash';

export const addAuditLogEntry = (entityId: string, eventType: string, details: Record<string, any>, privateKey: string): AuditLogEntry => {
    const timestamp = new Date().toISOString();
    const dataToHash = JSON.stringify({ timestamp, entityId, eventType, details, prevHash: lastAuditHash });
    const currentHash = btoa(dataToHash);
    const signature = simulateSignData(currentHash, privateKey);

    const newEntry: AuditLogEntry = {
        id: generateUniqueId(),
        timestamp,
        entityId,
        eventType,
        details,
        hash: currentHash,
        prevHash: lastAuditHash,
        signature,
    };
    currentAuditLog.push(newEntry);
    lastAuditHash = currentHash;
    return newEntry;
};

export const getAuditLog = () => [...currentAuditLog];

// --- IDENTITY SERVICE ---
export class DigitalIdentityService {
    private identities: Map<string, DigitalIdentity> = new Map();
    private encryptedPrivateKeys: Map<string, string> = new Map();

    constructor() {
        this.registerIdentity('system', 'service', ['admin', 'system'], 'L3');
        this.registerIdentity('agent-orchestrator-001', 'agent', ['agent.orchestration', 'admin'], 'L3');
    }

    public registerIdentity(id: string, type: DigitalIdentity['type'], roles: string[], verificationLevel: DigitalIdentity['verificationLevel']): DigitalIdentity {
        const { publicKey, privateKey } = simulateGenerateKeyPair();
        const identity: DigitalIdentity = {
            id, type, publicKey, privateKeyEncrypted: btoa(privateKey), roles, verificationLevel,
            lastAuthAt: new Date().toISOString(), status: 'active', accessLog: []
        };
        this.identities.set(id, identity);
        this.encryptedPrivateKeys.set(id, btoa(privateKey));
        return identity;
    }

    public getIdentity(id: string) { return this.identities.get(id); }
    public getPrivateKey(id: string) { return atob(this.encryptedPrivateKeys.get(id) || ''); }

    public authorize(entityId: string, requiredRoles: string[] = [], minVerificationLevel: DigitalIdentity['verificationLevel'] = 'L1'): boolean {
        const identity = this.getIdentity(entityId);
        if (!identity || identity.status !== 'active') return false;
        const hasRoles = requiredRoles.every(role => identity.roles.includes(role));
        const levels = { 'L1': 1, 'L2': 2, 'L3': 3 };
        return hasRoles && levels[identity.verificationLevel] >= levels[minVerificationLevel];
    }
}

export const digitalIdentityService = new DigitalIdentityService();

// --- FINANCE SERVICE ---
export class ProgrammableTokenRailService {
    private tokenLedger: Map<string, TokenBalance[]> = new Map();
    private tokenMetadata: Map<string, TokenMetadata> = new Map();
    private ledgerEntries: LedgerEntry[] = [];
    private lastLedgerHash: string = 'genesis_ledger_hash';
    private rails: Map<string, ProgrammableRail> = new Map();
    private policies: Map<string, SettlementPolicy> = new Map();

    constructor() {
        this.issueToken('Sonic Credit', 'SAC', 2, 1000000, 'system', 'SA-CREDIT-ID');
        this.addRail({ id: 'fast_rail', name: 'Instant Rail', latencyMs: 20, costPerTx: 0.05, securityLevel: 'medium', throughputTxPerSec: 5000, isActive: true, policies: [] });
        this.addRail({ id: 'secure_rail', name: 'Safe Rail', latencyMs: 200, costPerTx: 0.25, securityLevel: 'cryptographic', throughputTxPerSec: 200, isActive: true, policies: ['L3_REQ'] });
    }

    private addRail(rail: ProgrammableRail) { this.rails.set(rail.id, rail); }
    public getActiveRails() { return Array.from(this.rails.values()).filter(r => r.isActive); }

    public issueToken(name: string, symbol: string, decimals: number, totalSupply: number, ownerId: string, id?: string): string {
        const tokenId = id || generateUniqueId();
        const meta: TokenMetadata = { id: tokenId, name, symbol, decimals, totalSupply, ownerId, issuanceDate: new Date().toISOString(), policyHash: 'N/A' };
        this.tokenMetadata.set(tokenId, meta);
        return tokenId;
    }

    public getTokenMetadata(id: string) { return this.tokenMetadata.get(id); }

    public getBalance(accountId: string, tokenId: string): number {
        const balances = this.tokenLedger.get(accountId) || [];
        return balances.find(b => b.tokenId === tokenId)?.amount || 0;
    }

    public updateBalance(accountId: string, tokenId: string, amount: number) {
        let balances = this.tokenLedger.get(accountId) || [];
        const entry = balances.find(b => b.tokenId === tokenId);
        if (entry) entry.amount += amount;
        else balances.push({ accountId, tokenId, amount });
        this.tokenLedger.set(accountId, balances);
    }

    public transferTokens(senderId: string, source: string, dest: string, tokenId: string, amount: number): Transaction | null {
        if (this.getBalance(source, tokenId) < amount) return null;
        
        const txId = generateUniqueId();
        const timestamp = new Date().toISOString();
        
        this.updateBalance(source, tokenId, -amount);
        this.updateBalance(dest, tokenId, amount);

        const tx: Transaction = {
            id: txId, type: 'transfer', initiatorId: senderId, sourceAccountId: source, 
            destinationAccountId: dest, tokenId, amount, timestamp, status: 'completed',
            signature: 'SIMULATED', ledgerEntryIds: [], riskScore: Math.random() * 100, routingPath: ['fast_rail']
        };

        const entry: LedgerEntry = {
            id: generateUniqueId(), transactionId: txId, accountId: source, tokenId, amount: -amount,
            timestamp, entryType: 'debit', balanceAfter: this.getBalance(source, tokenId),
            hash: 'SIM-HASH', prevHash: this.lastLedgerHash
        };
        this.ledgerEntries.push(entry);
        this.lastLedgerHash = entry.hash;

        return tx;
    }
}

export const programmableTokenRailService = new ProgrammableTokenRailService();

// --- AGENT MESSAGING ---
export class AgentMessagingLayer {
    private history: AgentMessage[] = [];
    private queue: AgentMessage[] = [];

    public sendMessage(senderId: string, receiverId: string, topic: string, payload: any, encrypt = false) {
        const msg: AgentMessage = {
            id: generateUniqueId(), senderId, receiverId, topic, payload, 
            timestamp: new Date().toISOString(), signature: 'SIM', isEncrypted: encrypt
        };
        this.history.push(msg);
        this.queue.push(msg);
        return msg;
    }

    public getMessages(agentId: string) {
        const msgs = this.queue.filter(m => m.receiverId === agentId);
        this.queue = this.queue.filter(m => m.receiverId !== agentId);
        return msgs;
    }
    public getHistory() { return this.history; }
}

export const agentMessagingLayer = new AgentMessagingLayer();

// --- AGENT BASE & INSTANCES ---
export abstract class Agent {
    public id: string;
    public name: string;
    public roles: string[];
    constructor(id: string, name: string, roles: string[]) {
        this.id = id; this.name = name; this.roles = roles;
    }
    public abstract observe(event: any): Promise<void>;
    public abstract decide(): Promise<AgentAction[]>;
}

export class MonitoringAgent extends Agent {
    private alerts: Alert[] = [];
    async observe(e: any) {
        if (e.riskScore > 80) {
            this.alerts.push({
                id: generateUniqueId(), type: 'security', severity: 'high', message: `Risk Score Alert: ${e.riskScore}`,
                timestamp: new Date().toISOString(), source: this.name, isResolved: false
            });
        }
    }
    async decide() { return []; }
    public getAlerts() { return this.alerts; }
}

export class RemediationAgent extends Agent {
    async observe(e: any) {}
    async decide() { return []; }
    async remediate(details: any) { console.log("Remediating...", details); }
}

export class OrchestrationAgent extends Agent {
    private actions: AgentAction[] = [];
    async observe(e: any) {}
    async decide() { return []; }
    public getActionLogs() { return this.actions; }
}

export const monitoringAgent = new MonitoringAgent('agent-monitoring-001', 'Watchdog', ['agent.monitoring']);
export const remediationAgent = new RemediationAgent('agent-remediation-001', 'Fixer', ['agent.remediation']);
export const orchestrationAgent = new OrchestrationAgent('agent-orchestrator-001', 'Commander', ['agent.orchestration']);
