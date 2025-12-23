import { createTimestampedStorage, generateId } from "@/app/shared/lib/storageFactory";
import { Certificate, CertificateGalleryItem, CERTIFICATE_VERSION } from './types';

interface CertificateStorage {
    version: string;
    lastUpdated: string;
    certificates: Record<string, CertificateGalleryItem>;
}

function getDefaultStorage(): CertificateStorage {
    return {
        version: CERTIFICATE_VERSION,
        lastUpdated: new Date().toISOString(),
        certificates: {},
    };
}

// Create storage using the factory
const certificateStorage = createTimestampedStorage<CertificateStorage>({
    storageKey: 'course-certificates',
    getDefault: getDefaultStorage,
    version: CERTIFICATE_VERSION,
    migrate: (oldData: unknown) => {
        const data = oldData as CertificateStorage;
        return {
            ...getDefaultStorage(),
            certificates: data?.certificates || {},
        };
    },
});

// Generate unique certificate ID
export function generateCertificateId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${randomPart}`.toUpperCase();
}

// Generate unique verification code
export function generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Get certificate storage
function getCertificateStorage(): CertificateStorage {
    return certificateStorage.get();
}

// Save certificate storage
function saveCertificateStorage(storage: CertificateStorage): void {
    certificateStorage.save(storage);
}

// Issue a new certificate
export function issueCertificate(
    learnerName: string,
    courseTitle: string,
    courseId: string,
    skills: string[],
    metadata: Certificate['metadata'],
    templateId: string = 'modern'
): Certificate {
    const id = generateCertificateId();
    const uniqueCode = generateVerificationCode();
    const now = new Date().toISOString();

    const certificate: Certificate = {
        id,
        uniqueCode,
        learnerName,
        courseTitle,
        courseId,
        completionDate: now,
        issuedDate: now,
        skills,
        issuerName: 'Course Platform',
        templateId,
        verificationUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${uniqueCode}`,
        metadata,
    };

    // Save to storage
    const storage = getCertificateStorage();
    storage.certificates[id] = {
        certificate,
        shareCount: 0,
    };
    saveCertificateStorage(storage);

    return certificate;
}

// Get all certificates
export function getAllCertificates(): CertificateGalleryItem[] {
    const storage = getCertificateStorage();
    return Object.values(storage.certificates).sort(
        (a, b) => new Date(b.certificate.issuedDate).getTime() - new Date(a.certificate.issuedDate).getTime()
    );
}

// Get certificate by ID
export function getCertificateById(id: string): CertificateGalleryItem | null {
    const storage = getCertificateStorage();
    return storage.certificates[id] || null;
}

// Get certificate by verification code
export function getCertificateByCode(code: string): Certificate | null {
    const storage = getCertificateStorage();
    const item = Object.values(storage.certificates).find(
        (c) => c.certificate.uniqueCode === code
    );
    return item?.certificate || null;
}

// Verify certificate
export function verifyCertificate(code: string): {
    isValid: boolean;
    certificate?: Certificate;
    message: string;
} {
    const certificate = getCertificateByCode(code);

    if (!certificate) {
        return {
            isValid: false,
            message: 'Certificate not found. The verification code may be invalid.',
        };
    }

    return {
        isValid: true,
        certificate,
        message: 'Certificate verified successfully.',
    };
}

// Update share count
export function incrementShareCount(certificateId: string): void {
    const storage = getCertificateStorage();
    if (storage.certificates[certificateId]) {
        storage.certificates[certificateId].shareCount++;
        storage.certificates[certificateId].sharedAt = new Date().toISOString();
        saveCertificateStorage(storage);
    }
}

// Mark as downloaded
export function markAsDownloaded(certificateId: string): void {
    const storage = getCertificateStorage();
    if (storage.certificates[certificateId]) {
        storage.certificates[certificateId].downloadedAt = new Date().toISOString();
        saveCertificateStorage(storage);
    }
}

// Delete certificate
export function deleteCertificate(id: string): boolean {
    const storage = getCertificateStorage();
    if (storage.certificates[id]) {
        delete storage.certificates[id];
        saveCertificateStorage(storage);
        return true;
    }
    return false;
}

// Get certificates by course
export function getCertificatesByCourse(courseId: string): CertificateGalleryItem[] {
    const storage = getCertificateStorage();
    return Object.values(storage.certificates)
        .filter((item) => item.certificate.courseId === courseId)
        .sort(
            (a, b) => new Date(b.certificate.issuedDate).getTime() - new Date(a.certificate.issuedDate).getTime()
        );
}

// Check if course has certificate
export function hasCertificateForCourse(courseId: string): boolean {
    const storage = getCertificateStorage();
    return Object.values(storage.certificates).some(
        (item) => item.certificate.courseId === courseId
    );
}

// Export all certificates data
export function exportCertificatesData(): string {
    const storage = getCertificateStorage();
    return JSON.stringify(storage, null, 2);
}

// Import certificates data
export function importCertificatesData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString) as CertificateStorage;
        if (!data.certificates) {
            throw new Error('Invalid certificate data format');
        }
        saveCertificateStorage(data);
        return true;
    } catch (error) {
        console.error('Failed to import certificates:', error);
        return false;
    }
}

// Clear all certificates
export function clearAllCertificates(): void {
    certificateStorage.clear();
}

// Format date for display
export function formatCertificateDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
