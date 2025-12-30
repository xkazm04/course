// Certificate Types and Interfaces

export interface Certificate {
    id: string;
    uniqueCode: string;
    learnerName: string;
    courseTitle: string;
    courseId: string;
    completionDate: string;
    issuedDate: string;
    skills: string[];
    issuerName: string;
    issuerLogo?: string;
    templateId: string;
    verificationUrl: string;
    metadata: CertificateMetadata;
}

export interface CertificateMetadata {
    totalHours: number;
    modulesCompleted: number;
    quizScore?: number;
    projectsCompleted?: number;
    specializations?: string[];
}

export interface CertificateTemplate {
    id: string;
    name: string;
    backgroundGradient: string;
    accentColor: string;
    borderStyle: string;
    badgeIcon: string;
}

export interface CertificateGalleryItem {
    certificate: Certificate;
    thumbnailUrl?: string;
    downloadedAt?: string;
    sharedAt?: string;
    shareCount: number;
}

export interface CertificateVerification {
    isValid: boolean;
    certificate?: Certificate;
    verifiedAt: string;
    errorMessage?: string;
}

export interface ShareOptions {
    platform: 'linkedin' | 'twitter' | 'facebook' | 'email' | 'copy';
    message?: string;
    includeSkills?: boolean;
}

export interface ExportOptions {
    format: 'pdf' | 'png' | 'jpg';
    quality: 'standard' | 'high';
    includeVerificationQR: boolean;
}

// Certificate Templates
export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
    {
        id: 'classic',
        name: 'Classic',
        backgroundGradient: 'from-[var(--forge-bg-daylight)] to-[var(--forge-bg-workshop)]',
        accentColor: 'indigo',
        borderStyle: 'solid',
        badgeIcon: 'award',
    },
    {
        id: 'modern',
        name: 'Modern',
        backgroundGradient: 'from-[var(--ember)]/10 to-[var(--ember-glow)]/10',
        accentColor: 'purple',
        borderStyle: 'gradient',
        badgeIcon: 'trophy',
    },
    {
        id: 'professional',
        name: 'Professional',
        backgroundGradient: 'from-[var(--forge-bg-daylight)] to-[var(--forge-info)]/10',
        accentColor: 'blue',
        borderStyle: 'double',
        badgeIcon: 'medal',
    },
    {
        id: 'elegant',
        name: 'Elegant',
        backgroundGradient: 'from-[var(--gold)]/10 to-[var(--ember)]/10',
        accentColor: 'orange',
        borderStyle: 'ornate',
        badgeIcon: 'crown',
    },
];

export const CERTIFICATE_VERSION = '1.0.0';
