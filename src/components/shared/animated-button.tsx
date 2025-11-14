'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Animated wrapper for Button component
 * Provides smooth hover and tap animations
 */
export function AnimatedButton({
  children,
  variant,
  size,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      className="inline-block"
    >
      <Button variant={variant} size={size} className={className} {...props}>
        {children}
      </Button>
    </motion.div>
  );
}
