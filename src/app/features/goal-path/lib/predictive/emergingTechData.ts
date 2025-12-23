/**
 * Emerging Technology Trends Data
 *
 * Mock data for emerging technology trends and adoption timelines.
 */

import type { EmergingTechTrend } from "../predictiveTypes";

export const emergingTechTrends: EmergingTechTrend[] = [
    {
        name: "AI Agents & Autonomous Systems",
        description: "Self-directed AI systems that can plan, reason, and execute complex tasks",
        maturityStage: "early_adoption",
        timeToMainstream: 18,
        prerequisites: ["Python", "LLM APIs", "Prompt Engineering"],
        riskLevel: "medium",
        disruptionPotential: "transformative",
    },
    {
        name: "Retrieval Augmented Generation (RAG)",
        description: "Enhancing LLMs with real-time knowledge retrieval for accurate responses",
        maturityStage: "growth",
        timeToMainstream: 6,
        prerequisites: ["Vector Databases", "Python", "LLM APIs"],
        riskLevel: "low",
        disruptionPotential: "high",
    },
    {
        name: "Edge AI & TinyML",
        description: "Running AI models on edge devices and microcontrollers",
        maturityStage: "early_adoption",
        timeToMainstream: 24,
        prerequisites: ["Python", "Embedded Systems", "Model Optimization"],
        riskLevel: "medium",
        disruptionPotential: "moderate",
    },
    {
        name: "WebAssembly (Wasm) for Backend",
        description: "Using Wasm for high-performance, portable server-side applications",
        maturityStage: "early_adoption",
        timeToMainstream: 30,
        prerequisites: ["Rust", "Systems Programming"],
        riskLevel: "medium",
        disruptionPotential: "moderate",
    },
    {
        name: "Serverless Edge Computing",
        description: "Running serverless functions at the edge for ultra-low latency",
        maturityStage: "growth",
        timeToMainstream: 12,
        prerequisites: ["JavaScript/TypeScript", "Cloud Fundamentals"],
        riskLevel: "low",
        disruptionPotential: "moderate",
    },
    {
        name: "Multi-Modal AI Applications",
        description: "AI systems that process and generate text, images, audio, and video",
        maturityStage: "early_adoption",
        timeToMainstream: 12,
        prerequisites: ["Python", "ML Fundamentals", "API Integration"],
        riskLevel: "low",
        disruptionPotential: "high",
    },
];
