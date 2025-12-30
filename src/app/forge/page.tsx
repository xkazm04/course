"use client";

import {
    ForgeBackground,
    HeroSection,
    HowItWorksSection,
    LearningPathSection,
    CTASection,
} from "./components";

export default function ForgePage() {
    return (
        <div className="relative min-h-screen">
            <ForgeBackground variant="dark" />
            <div className="relative z-10">
                <HeroSection />
                <HowItWorksSection />
                <LearningPathSection />
                <CTASection />
            </div>
        </div>
    );
}
