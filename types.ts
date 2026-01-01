
export interface AgentAction {
    id: string;
    agentId: string;
    actionType: 'observe' | 'decide' | 'communicate' | 'remediate' | 'enforce';
    targetId?: string;
    payload: Record<string, any>;
    timestamp: string;
    signature: string;
    status: 'pending' | 'completed' | 'failed' | 'reverted';
    traceId?: string;
}

export interface AgentMessage {
    id: string;
    senderId: string;
    receiverId: string;
    topic: string;
    payload: Record<string, any>;
    timestamp: string;
    signature: string;
    isEncrypted: boolean;
}

export interface DigitalIdentity {
    id: string;
    type: 'user' | 'agent' | 'service';
    publicKey: string;
    privateKeyEncrypted?: string;
    roles: string[];
    verificationLevel: 'L1' | 'L2' | 'L3';
    lastAuthAt: string;
    status: 'active' | 'suspended' | 'deactivated';
    accessLog: string[];
}

export interface TokenMetadata {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
    ownerId: string;
    issuanceDate: string;
    policyHash: string;
}

export interface TokenBalance {
    accountId: string;
    tokenId: string;
    amount: number;
}

export interface LedgerEntry {
    id: string;
    transactionId: string;
    accountId: string;
    tokenId: string;
    amount: number;
    timestamp: string;
    entryType: 'debit' | 'credit' | 'fee';
    balanceBefore?: number;
    balanceAfter: number;
    hash: string;
    prevHash: string;
}

export interface Transaction {
    id: string;
    type: 'transfer' | 'mint' | 'burn' | 'settlement' | 'fee';
    initiatorId: string;
    sourceAccountId?: string;
    destinationAccountId?: string;
    tokenId: string;
    amount: number;
    timestamp: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'reverted';
    signature: string;
    metadata?: Record<string, any>;
    ledgerEntryIds: string[];
    routingPath?: string[];
    policyViolations?: string[];
    riskScore?: number;
}

export interface ProgrammableRail {
    id: string;
    name: string;
    latencyMs: number;
    costPerTx: number;
    securityLevel: 'low' | 'medium' | 'high' | 'cryptographic';
    throughputTxPerSec: number;
    isActive: boolean;
    policies: string[];
}

export interface SettlementPolicy {
    id: string;
    name: string;
    description: string;
    rules: {
        condition: string;
        action: string;
    }[];
    isActive: boolean;
}

export interface Alert {
    id: string;
    type: 'security' | 'performance' | 'compliance' | 'operational';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    source: string;
    isResolved: boolean;
    resolvedBy?: string;
    relatedTransactionId?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    entityId: string;
    eventType: string;
    details: Record<string, any>;
    hash: string;
    prevHash: string;
    signature: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
    bio: string;
    memberSince: string;
    preferredGenre: string;
    preferredInstruments: string[];
    allowPublicGenerations: boolean;
    storageUsedGB: number;
    maxStorageGB: number;
    subscriptionLevel: 'Free' | 'Pro' | 'Enterprise';
    lastLogin: string;
    digitalIdentityId: string;
}

export interface Composition {
    id: string;
    userId: string;
    title: string;
    description: string;
    instrumentation: string[];
    genre: string;
    mood: string;
    tempo: number;
    keySignature: string;
    durationSeconds: number;
    audioUrl: string;
    waveformJson: string;
    midiData?: string;
    createdAt: string;
    lastModifiedAt: string;
    isPublic: boolean;
    tags: string[];
    versionHistory: CompositionVersion[];
    remixSourceId?: string;
    likes: number;
    comments: Comment[];
    playCount: number;
    downloadCount: number;
    modelUsed: string;
    originalPrompt: string;
    generationParameters: GenerationParameters;
}

export interface CompositionVersion {
    versionId: string;
    promptUsed: string;
    parameters: GenerationParameters;
    generatedAt: string;
    audioUrl: string;
    midiUrl?: string;
    notes?: string;
}

export interface Comment {
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: string;
    avatarUrl: string;
}

export interface GenerationParameters {
    genre: string;
    mood: string;
    tempoRange: [number, number];
    instrumentationPreference: string[];
    durationPreference: [number, number];
    keySignaturePreference: string;
    creativityTemperature: number;
    diversityPenalty: number;
    model: string;
    outputFormat: 'audio' | 'midi' | 'description';
    styleReferenceId?: string;
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    description: string;
    compositionIds: string[];
    createdAt: string;
    lastModifiedAt: string;
    isShared: boolean;
    sharedWithUserIds?: string[];
}

export interface AppSettings {
    theme: 'dark' | 'light';
    defaultGenre: string;
    defaultInstrumentation: string[];
    autoSave: boolean;
    notificationsEnabled: boolean;
    audioQuality: 'low' | 'medium' | 'high';
    defaultOutputFormat: 'audio' | 'midi' | 'description';
    onboardingComplete: boolean;
    defaultCurrencyTokenId: string;
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'new_like' | 'new_comment' | 'system' | 'update_available' | 'transaction_alert' | 'agent_action';
    message: string;
    timestamp: string;
    isRead: boolean;
    link?: string;
    icon?: string;
}

export interface PlaybackState {
    currentCompositionId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    loop: boolean;
    shuffle: boolean;
    playbackSpeed: number;
    reverbAmount: number;
    delayAmount: number;
}

export interface UserStats {
    totalCompositions: number;
    publicCompositions: number;
    totalPlaybacks: number;
    totalLikesReceived: number;
    last7DaysGenerations: number[];
    mostUsedGenre: string;
    mostUsedInstrument: string;
    totalTokensOwned: number;
    totalTransactions: number;
}
