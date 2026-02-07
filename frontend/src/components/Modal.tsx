import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    /** Whether the modal is currently visible */
    isOpen: boolean;
    /** Callback function when the modal should close */
    onClose: () => void;
    /** Title of the modal shown in the header */
    title?: React.ReactNode;
    /** Contnet of the modal */
    children: React.ReactNode;
    /** Optional footer content (usually buttons) */
    footer?: React.ReactNode;
    /** Size of the modal */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Whether to show the close 'X' button in the top right */
    showCloseButton?: boolean;
    /** Whether clicking the backdrop should trigger onClose */
    closeOnOutsideClick?: boolean;
    /** Whether pressing Escape should trigger onClose */
    closeOnEsc?: boolean;
    /** Custom class for the modal container */
    className?: string;
}

/**
 * A premium, responsive Modal component built for React 19.
 * Uses portals to render at the top level and includes sleek backdrop-blur and glassmorphism.
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    showCloseButton = true,
    closeOnOutsideClick = true,
    closeOnEsc = true,
    className = '',
}: ModalProps) => {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation lifecycle
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // Small delay to trigger entry animation
            const timer = setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden';
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setMounted(false), 300); // Wait for exit animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') {
                onClose();
            }
        },
        [closeOnEsc, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!mounted) return null;

    const sizeClasses = {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[calc(100%-2rem)] md:max-w-[calc(100%-4rem)] w-full h-[calc(100%-2rem)] md:h-[calc(100%-4rem)]',
    };

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop with Glassmorphism */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
                aria-hidden="true"
                onClick={closeOnOutsideClick ? onClose : undefined}
            />

            {/* Modal Card */}
            <div
                className={`
          relative w-full ${sizeClasses[size]} 
          bg-zinc-900/90 border border-zinc-800/50 
          rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] 
          flex flex-col overflow-hidden
          transform transition-all duration-300 ease-out
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}
          ${className}
        `}
            >

                {/* Modal Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
                        {title && (
                            <h2 className="text-xl font-bold bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="group relative p-2 rounded-xl bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-200"
                                aria-label="Close modal"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {children}
                </div>

                {/* Modal Footer */}
                {footer && (
                    <div className="px-6 py-5 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
