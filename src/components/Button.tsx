import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export function Button({ children, variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-6 py-3 rounded-full font-semibold text-white transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90',
        variant === 'secondary' && 'bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90',
        variant === 'success' && 'bg-gradient-to-r from-green-400 to-cyan-500 hover:opacity-90',
        variant === 'danger' && 'bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}