import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.995 },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 0.8,
};

const AnimatedPage = ({ children, className }: AnimatedPageProps) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    className={className}
    style={{ willChange: "opacity, transform" }}
  >
    {children}
  </motion.div>
);

export default AnimatedPage;
