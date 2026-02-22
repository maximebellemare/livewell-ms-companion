import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const AnimatedPage = ({ children, className }: AnimatedPageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.99 }}
    animate={{
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 28,
        mass: 0.8,
      },
    }}
    exit={{
      opacity: 0,
      y: -6,
      scale: 0.995,
      transition: {
        type: "tween",
        ease: "easeIn",
        duration: 0.15,
      },
    }}
    style={{ willChange: "opacity, transform" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedPage;
