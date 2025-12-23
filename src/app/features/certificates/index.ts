// Types
export * from "./lib/types";

// Storage functions
export {
    generateCertificateId,
    generateVerificationCode,
    issueCertificate,
    getAllCertificates,
    getCertificateById,
    getCertificateByCode,
    verifyCertificate,
    incrementShareCount,
    markAsDownloaded,
    deleteCertificate,
    getCertificatesByCourse,
    hasCertificateForCourse,
    exportCertificatesData,
    importCertificatesData,
    clearAllCertificates,
    formatCertificateDate,
} from "./lib/certificateStorage";

// Generator functions
export {
    generateCertificateSVG,
    svgToDataUrl,
    downloadCertificateImage,
    downloadCertificatePDF,
    generateShareUrl,
    generateLinkedInShareUrl,
    generateTwitterShareUrl,
    generateFacebookShareUrl,
    generateEmailShareUrl,
    copyShareLink,
} from "./lib/certificateGenerator";

// Hooks
export { useCertificates, useCertificateVerification } from "./lib/useCertificates";

// Components
export {
    CertificateDisplay,
    CertificateModal,
    CertificateGallery,
    CertificateIssueModal,
    CertificateVerification,
    CertificatesPage,
} from "./components";
