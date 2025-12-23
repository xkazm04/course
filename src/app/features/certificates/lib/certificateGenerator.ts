import { Certificate, CertificateTemplate, CERTIFICATE_TEMPLATES, ExportOptions } from './types';
import { formatCertificateDate } from './certificateStorage';
import { HEX_COLORS, GRADIENT_HEX_COLORS } from '@/app/shared/lib/learningDomains';

// Generate certificate SVG for rendering and export
export function generateCertificateSVG(
    certificate: Certificate,
    template?: CertificateTemplate
): string {
    const selectedTemplate = template || CERTIFICATE_TEMPLATES.find(t => t.id === certificate.templateId) || CERTIFICATE_TEMPLATES[0];

    const gradientColors = getGradientColors(selectedTemplate.backgroundGradient);
    const accentHex = getAccentHex(selectedTemplate.accentColor);

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientColors.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientColors.end};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accentHex};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentHex};stop-opacity:0.7" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.1"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGradient)" rx="8"/>

  <!-- Border -->
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="${accentHex}" stroke-width="2" stroke-opacity="0.3" rx="4"/>
  <rect x="30" y="30" width="740" height="540" fill="none" stroke="${accentHex}" stroke-width="1" stroke-opacity="0.2" rx="4"/>

  <!-- Corner Decorations -->
  <path d="M50 50 L100 50 L100 55 L55 55 L55 100 L50 100 Z" fill="${accentHex}" opacity="0.4"/>
  <path d="M750 50 L700 50 L700 55 L745 55 L745 100 L750 100 Z" fill="${accentHex}" opacity="0.4"/>
  <path d="M50 550 L100 550 L100 545 L55 545 L55 500 L50 500 Z" fill="${accentHex}" opacity="0.4"/>
  <path d="M750 550 L700 550 L700 545 L745 545 L745 500 L750 500 Z" fill="${accentHex}" opacity="0.4"/>

  <!-- Badge Icon -->
  <circle cx="400" cy="100" r="40" fill="${accentHex}" opacity="0.1"/>
  <circle cx="400" cy="100" r="30" fill="${accentHex}" opacity="0.2"/>
  ${getBadgeSVG(selectedTemplate.badgeIcon, accentHex)}

  <!-- Certificate Header -->
  <text x="400" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#666" letter-spacing="4">
    CERTIFICATE OF COMPLETION
  </text>

  <!-- Decorative Line -->
  <line x1="200" y1="190" x2="600" y2="190" stroke="url(#accentGradient)" stroke-width="2"/>

  <!-- This certifies text -->
  <text x="400" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#888">
    This is to certify that
  </text>

  <!-- Learner Name -->
  <text x="400" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#1a1a2e">
    ${escapeXml(certificate.learnerName)}
  </text>

  <!-- Underline for name -->
  <line x1="150" y1="295" x2="650" y2="295" stroke="${accentHex}" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Completion text -->
  <text x="400" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#888">
    has successfully completed
  </text>

  <!-- Course Title -->
  <text x="400" y="385" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="${accentHex}">
    ${escapeXml(truncateText(certificate.courseTitle, 45))}
  </text>

  <!-- Skills Section -->
  <text x="400" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666">
    Skills Acquired: ${escapeXml(certificate.skills.slice(0, 4).join(' • '))}
  </text>

  <!-- Metadata -->
  <text x="400" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#888">
    ${certificate.metadata.totalHours} hours • ${certificate.metadata.modulesCompleted} modules completed${certificate.metadata.quizScore ? ` • Quiz Score: ${certificate.metadata.quizScore}%` : ''}
  </text>

  <!-- Date and Issuer Section -->
  <text x="200" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666">
    Completion Date
  </text>
  <text x="200" y="530" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#333">
    ${formatCertificateDate(certificate.completionDate)}
  </text>

  <text x="600" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666">
    Issued By
  </text>
  <text x="600" y="530" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#333">
    ${escapeXml(certificate.issuerName)}
  </text>

  <!-- Verification Code -->
  <rect x="300" y="555" width="200" height="25" fill="${accentHex}" opacity="0.1" rx="4"/>
  <text x="400" y="572" text-anchor="middle" font-family="Courier, monospace" font-size="10" fill="#666">
    Verify: ${certificate.uniqueCode}
  </text>

  <!-- Certificate ID (small footer) -->
  <text x="750" y="590" text-anchor="end" font-family="Arial, sans-serif" font-size="8" fill="#ccc">
    ID: ${certificate.id}
  </text>
</svg>`.trim();
}

// Helper to get badge SVG based on icon type
function getBadgeSVG(icon: string, color: string): string {
    const icons: Record<string, string> = {
        award: `<path d="M400 70 L410 90 L432 93 L416 108 L420 130 L400 120 L380 130 L384 108 L368 93 L390 90 Z" fill="${color}"/>`,
        trophy: `<path d="M385 75 h30 v10 c0 15 -5 25 -15 30 v10 h-10 v-10 c-10 -5 -15 -15 -15 -30 v-10 h10 Z M370 75 c-8 0 -10 8 -8 15 s8 12 13 12 M430 75 c8 0 10 8 8 15 s-8 12 -13 12 M385 125 h30 v5 h-30 Z" fill="${color}" stroke="${color}" stroke-width="1"/>`,
        medal: `<circle cx="400" cy="105" r="20" fill="none" stroke="${color}" stroke-width="3"/><circle cx="400" cy="105" r="12" fill="${color}"/><path d="M390 75 L400 85 L410 75" stroke="${color}" stroke-width="2" fill="none"/>`,
        crown: `<path d="M370 110 L380 85 L390 100 L400 80 L410 100 L420 85 L430 110 Z" fill="${color}"/><rect x="375" y="110" width="50" height="10" fill="${color}"/>`,
    };
    return icons[icon] || icons.award;
}

// Get gradient colors from Tailwind class
function getGradientColors(gradient: string): { start: string; end: string } {
    return GRADIENT_HEX_COLORS[gradient] || { start: '#ffffff', end: '#f5f5f5' };
}

// Get accent color hex
function getAccentHex(color: string): string {
    return HEX_COLORS[color as keyof typeof HEX_COLORS] || HEX_COLORS.indigo;
}

// Escape XML special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Convert SVG to Data URL
export function svgToDataUrl(svg: string): string {
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml,${encoded}`;
}

// Download certificate as image (PNG/JPG)
export async function downloadCertificateImage(
    certificate: Certificate,
    options: ExportOptions = { format: 'png', quality: 'high', includeVerificationQR: true }
): Promise<void> {
    const svg = generateCertificateSVG(certificate);
    const dataUrl = svgToDataUrl(svg);

    // Create canvas for conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const scale = options.quality === 'high' ? 2 : 1;
    canvas.width = 800 * scale;
    canvas.height = 600 * scale;
    ctx.scale(scale, scale);

    // Create image from SVG
    const img = new Image();

    return new Promise((resolve, reject) => {
        img.onload = () => {
            // Fill white background for JPG
            if (options.format === 'jpg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            // Convert to blob and download
            const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to create image blob'));
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `certificate-${certificate.id}.${options.format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            }, mimeType, options.quality === 'high' ? 1.0 : 0.8);
        };

        img.onerror = () => {
            reject(new Error('Failed to load SVG image'));
        };

        img.src = dataUrl;
    });
}

// Download certificate as PDF (simplified using print)
export function downloadCertificatePDF(certificate: Certificate): void {
    const svg = generateCertificateSVG(certificate);

    // Create a new window with the certificate for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to download the PDF');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Certificate - ${certificate.learnerName}</title>
            <style>
                @page {
                    size: landscape;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #f5f5f5;
                }
                .certificate-container {
                    background: white;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .certificate-container {
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                ${svg}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Generate shareable certificate URL
export function generateShareUrl(certificate: Certificate): string {
    return certificate.verificationUrl;
}

// Generate LinkedIn share URL
export function generateLinkedInShareUrl(certificate: Certificate): string {
    const title = encodeURIComponent(`Certificate of Completion: ${certificate.courseTitle}`);
    const summary = encodeURIComponent(
        `I just completed ${certificate.courseTitle} and earned a certificate! Skills acquired: ${certificate.skills.join(', ')}`
    );
    const url = encodeURIComponent(certificate.verificationUrl);

    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
}

// Generate Twitter share URL
export function generateTwitterShareUrl(certificate: Certificate): string {
    const text = encodeURIComponent(
        `🎉 Just completed "${certificate.courseTitle}" and earned my certificate! ${certificate.skills.slice(0, 3).join(', ')} #Learning #Certificate`
    );
    const url = encodeURIComponent(certificate.verificationUrl);

    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

// Generate Facebook share URL
export function generateFacebookShareUrl(certificate: Certificate): string {
    const url = encodeURIComponent(certificate.verificationUrl);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

// Generate email share URL
export function generateEmailShareUrl(certificate: Certificate): string {
    const subject = encodeURIComponent(`Certificate of Completion: ${certificate.courseTitle}`);
    const body = encodeURIComponent(
        `I just completed ${certificate.courseTitle}!\n\nSkills acquired: ${certificate.skills.join(', ')}\n\nVerify my certificate: ${certificate.verificationUrl}`
    );
    return `mailto:?subject=${subject}&body=${body}`;
}

// Copy share link to clipboard
export async function copyShareLink(certificate: Certificate): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(certificate.verificationUrl);
        return true;
    } catch {
        return false;
    }
}
