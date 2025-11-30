import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function for conditionally joining class names.
 * Wraps clsx for consistent usage across the codebase.
 */
export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

