/**
 * Animation Configuration
 *
 * Centralized animation variants for consistent motion design across the app.
 * Using framer-motion for smooth, performant animations.
 */

import { Variants } from 'framer-motion';

/**
 * Standard easing curves
 */
export const easing = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  soft: { type: 'spring', stiffness: 100, damping: 15 },
} as const;

/**
 * Standard animation durations (in seconds)
 */
export const duration = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

/**
 * Page transition animations
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Card animations (for post cards, user cards, etc.)
 */
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easing.smooth,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * Stagger animation for lists
 */
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Scale and fade animation (for modals, dialogs)
 */
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Slide from bottom animation (for modals on mobile)
 */
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 100,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * Button press animation
 */
export const buttonVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: duration.fast,
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * Loading spinner animation
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
