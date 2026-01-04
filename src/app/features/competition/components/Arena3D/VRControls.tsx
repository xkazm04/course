"use client";

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR, XROrigin } from "@react-three/xr";
import { Group, Vector3 } from "three";
import { OrbitControls } from "@react-three/drei";
import { VRConfig, ArenaPosition } from "../../lib/arenaTypes";

interface VRControllerProps {
    onSelect?: (position: Vector3) => void;
    onTeleport?: (position: ArenaPosition) => void;
}

// VR controller interaction component
export const VRController: React.FC<VRControllerProps> = ({ onSelect, onTeleport }) => {
    const controllerRef = useRef<Group>(null);

    useFrame(() => {
        // Update controller visuals if needed
    });

    return (
        <group ref={controllerRef}>
            {/* XR controllers are handled by the XR component in @react-three/xr v6+ */}
            {/* Custom controller visuals can be added here */}
            <XROrigin />
        </group>
    );
};

// Teleportation target indicator
interface TeleportIndicatorProps {
    position: Vector3 | null;
    valid: boolean;
}

export const TeleportIndicator: React.FC<TeleportIndicatorProps> = ({ position, valid }) => {
    if (!position) return null;

    return (
        <group position={position}>
            {/* Ring indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshBasicMaterial
                    color={valid ? "#4ADE80" : "#F87171"}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Center dot */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.1, 16]} />
                <meshBasicMaterial color={valid ? "#4ADE80" : "#F87171"} />
            </mesh>

            {/* Vertical beam */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
                <meshBasicMaterial
                    color={valid ? "#4ADE80" : "#F87171"}
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </group>
    );
};

// VR-friendly competitor info panel
interface VRInfoPanelProps {
    competitorName: string;
    rank: number;
    tier: string;
    score: number;
    position: Vector3;
    onClose?: () => void;
}

export const VRInfoPanel: React.FC<VRInfoPanelProps> = ({
    competitorName,
    rank,
    tier,
    score,
    position,
    onClose,
}) => {
    return (
        <group position={position} onClick={onClose}>
            {/* Panel background */}
            <mesh>
                <planeGeometry args={[1.5, 1]} />
                <meshBasicMaterial color="#1C1C1F" transparent opacity={0.9} />
            </mesh>

            {/* Border */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.55, 1.05]} />
                <meshBasicMaterial color="#F97316" transparent opacity={0.5} />
            </mesh>

            {/* Close button (X in corner) */}
            <mesh position={[0.65, 0.4, 0.01]} onClick={onClose}>
                <circleGeometry args={[0.1, 16]} />
                <meshBasicMaterial color="#F87171" />
            </mesh>
        </group>
    );
};

// VR teleportation floor with valid zones
interface VRTeleportFloorProps {
    onTeleport: (position: Vector3) => void;
}

export const VRTeleportFloor: React.FC<VRTeleportFloorProps> = ({ onTeleport }) => {
    const xrState = useXR();
    const isPresenting = xrState?.isPresenting ?? false;

    if (!isPresenting) return null;

    return (
        <group>
            {/* Visible floor boundary */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.01, 5]}
                onClick={(e) => {
                    e.stopPropagation();
                    onTeleport(e.point);
                }}
            >
                <circleGeometry args={[25, 64]} />
                <meshBasicMaterial
                    color="#F97316"
                    transparent
                    opacity={0.1}
                    wireframe
                />
            </mesh>
        </group>
    );
};

// VR mode toggle and session management
interface VRModeManagerProps {
    config: VRConfig;
    onConfigChange: (config: VRConfig) => void;
    children: React.ReactNode;
}

export const VRModeManager: React.FC<VRModeManagerProps> = ({
    config,
    onConfigChange,
    children,
}) => {
    const [vrSupported, setVrSupported] = useState(false);

    useEffect(() => {
        // Check for WebXR support
        if (typeof navigator !== "undefined" && "xr" in navigator) {
            (navigator as any).xr?.isSessionSupported?.("immersive-vr").then((supported: boolean) => {
                setVrSupported(supported);
            });
        }
    }, []);

    if (!vrSupported && config.enabled) {
        console.warn("VR not supported on this device");
    }

    return (
        <group>
            {config.enabled && (
                <>
                    <VRController />
                    <VRTeleportFloor onTeleport={(pos) => console.log("Teleport to", pos)} />
                </>
            )}
            {children}
        </group>
    );
};

// VR button for entering/exiting VR mode (use outside of Canvas)
interface VRButtonProps {
    onEnterVR: () => void;
    onExitVR: () => void;
}

export const VREntryButton: React.FC<VRButtonProps> = ({ onEnterVR, onExitVR }) => {
    const [isPresenting, setIsPresenting] = useState(false);

    return (
        <button
            onClick={isPresenting ? onExitVR : onEnterVR}
            className="absolute bottom-4 right-4 px-4 py-2 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)] rounded-lg text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] transition-colors flex items-center gap-2"
            data-testid="vr-toggle-btn"
        >
            <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-2 3-2-3H4a2 2 0 0 1-2-2V8z" />
                <circle cx="8" cy="12" r="2" />
                <circle cx="16" cy="12" r="2" />
            </svg>
            {isPresenting ? "Exit VR" : "Enter VR"}
        </button>
    );
};

// Desktop fallback camera controls
interface DesktopControlsProps {
    enabled: boolean;
}

export const DesktopCameraControls: React.FC<DesktopControlsProps> = ({ enabled }) => {
    if (!enabled) return null;

    return (
        <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 2, 5]}
        />
    );
};

export default VRModeManager;
