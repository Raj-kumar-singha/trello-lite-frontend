'use client';

import { useEffect } from 'react';

/**
 * Suppresses known warnings from third-party libraries
 * Handles hydration warnings from browser extensions and other non-critical warnings
 */
export default function SuppressWarnings() {
  useEffect(() => {
    // Suppress hydration warnings from browser extensions and other non-critical warnings
    const originalError = console.error;
    const originalWarn = console.warn;

    const shouldSuppress = (message: any): boolean => {
      if (typeof message === 'string') {
        return (
          message.includes('defaultProps') ||
          message.includes('Connect(Droppable)') ||
          message.includes('Connect(Draggable)') ||
          message.includes('Support for defaultProps will be removed') ||
          message.includes('Extra attributes from the server') ||
          message.includes('data-new-gr-c-s-check-loaded') ||
          message.includes('data-gr-ext-installed') ||
          message.includes('Unable to find draggable with id') ||
          message.includes('We have detected that your') ||
          (message.includes('body') && message.includes('scroll container')) ||
          (message.includes('@hello-pangea/dnd') && message.includes('scroll'))
        );
      }
      // Check if it's a React warning object
      if (message && typeof message === 'object') {
        const messageStr = JSON.stringify(message);
        return (
          messageStr.includes('defaultProps') ||
          messageStr.includes('Connect(Droppable)') ||
          messageStr.includes('Connect(Draggable)') ||
          messageStr.includes('Extra attributes from the server') ||
          messageStr.includes('data-new-gr-c-s-check-loaded') ||
          messageStr.includes('data-gr-ext-installed') ||
          messageStr.includes('Unable to find draggable') ||
          messageStr.includes('We have detected that your') ||
          (messageStr.includes('body') && messageStr.includes('scroll container')) ||
          (messageStr.includes('@hello-pangea/dnd') && messageStr.includes('scroll'))
        );
      }
      return false;
    };

    console.error = (...args: any[]) => {
      // Suppress known non-critical warnings
      if (shouldSuppress(args[0])) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      // Suppress known non-critical warnings
      if (shouldSuppress(args[0])) {
        return;
      }
      originalWarn.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

