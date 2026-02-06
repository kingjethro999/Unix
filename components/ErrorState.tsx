'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    message?: string;
    className?: string;
    onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", className, onRetry }: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-4 text-destructive space-y-2 rounded-md bg-destructive/10", className)}>
            <AlertCircle className="w-6 h-6" />
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-xs underline hover:no-underline opacity-80"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
