"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "వేచండి..." }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#e85d00] border-t-transparent" />
      <p className="text-xl font-bold text-gray-700">{message}</p>
    </div>
  );
}
