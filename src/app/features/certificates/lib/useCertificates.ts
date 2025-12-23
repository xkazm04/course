"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Certificate,
    CertificateGalleryItem,
} from './types';
import {
    getAllCertificates,
    getCertificateById,
    issueCertificate,
    deleteCertificate,
    verifyCertificate,
    incrementShareCount,
    markAsDownloaded,
    hasCertificateForCourse,
} from './certificateStorage';
import {
    downloadCertificateImage,
    downloadCertificatePDF,
    generateLinkedInShareUrl,
    generateTwitterShareUrl,
    generateFacebookShareUrl,
    generateEmailShareUrl,
    copyShareLink,
} from './certificateGenerator';

export function useCertificates() {
    const [certificates, setCertificates] = useState<CertificateGalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        setIsLoading(true);
        const certs = getAllCertificates();
        setCertificates(certs);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const issue = useCallback(
        (
            learnerName: string,
            courseTitle: string,
            courseId: string,
            skills: string[],
            metadata: Certificate['metadata'],
            templateId?: string
        ) => {
            const certificate = issueCertificate(
                learnerName,
                courseTitle,
                courseId,
                skills,
                metadata,
                templateId
            );
            refresh();
            return certificate;
        },
        [refresh]
    );

    const remove = useCallback(
        (id: string) => {
            const success = deleteCertificate(id);
            if (success) refresh();
            return success;
        },
        [refresh]
    );

    const download = useCallback(
        async (id: string, format: 'pdf' | 'png' | 'jpg' = 'png') => {
            const item = getCertificateById(id);
            if (!item) return false;

            try {
                if (format === 'pdf') {
                    downloadCertificatePDF(item.certificate);
                } else {
                    await downloadCertificateImage(item.certificate, {
                        format,
                        quality: 'high',
                        includeVerificationQR: true,
                    });
                }
                markAsDownloaded(id);
                refresh();
                return true;
            } catch (error) {
                console.error('Download failed:', error);
                return false;
            }
        },
        [refresh]
    );

    const share = useCallback(
        async (
            id: string,
            platform: 'linkedin' | 'twitter' | 'facebook' | 'email' | 'copy'
        ) => {
            const item = getCertificateById(id);
            if (!item) return false;

            const cert = item.certificate;
            let success = false;

            switch (platform) {
                case 'linkedin':
                    window.open(generateLinkedInShareUrl(cert), '_blank');
                    success = true;
                    break;
                case 'twitter':
                    window.open(generateTwitterShareUrl(cert), '_blank');
                    success = true;
                    break;
                case 'facebook':
                    window.open(generateFacebookShareUrl(cert), '_blank');
                    success = true;
                    break;
                case 'email':
                    window.location.href = generateEmailShareUrl(cert);
                    success = true;
                    break;
                case 'copy':
                    success = await copyShareLink(cert);
                    break;
            }

            if (success) {
                incrementShareCount(id);
                refresh();
            }

            return success;
        },
        [refresh]
    );

    const verify = useCallback((code: string) => {
        return verifyCertificate(code);
    }, []);

    const hasCertificate = useCallback((courseId: string) => {
        return hasCertificateForCourse(courseId);
    }, []);

    return {
        certificates,
        isLoading,
        refresh,
        issue,
        remove,
        download,
        share,
        verify,
        hasCertificate,
    };
}

export function useCertificateVerification(code: string | null) {
    const [result, setResult] = useState<{
        isLoading: boolean;
        isValid: boolean;
        certificate: Certificate | null;
        message: string;
    }>({
        isLoading: true,
        isValid: false,
        certificate: null,
        message: '',
    });

    useEffect(() => {
        if (!code) {
            setResult({
                isLoading: false,
                isValid: false,
                certificate: null,
                message: 'No verification code provided.',
            });
            return;
        }

        const { isValid, certificate, message } = verifyCertificate(code);
        setResult({
            isLoading: false,
            isValid,
            certificate: certificate || null,
            message,
        });
    }, [code]);

    return result;
}
