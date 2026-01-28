"use client";

import { motion } from "framer-motion";
import { UserProgressView } from "./UserProgressView";
import { forgeEasing } from "../lib/animations";

export default function ProgressPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ease: forgeEasing }}
        >
            <UserProgressView />
        </motion.div>
    );
}
