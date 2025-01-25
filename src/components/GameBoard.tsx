import React from 'react';
import clsx from 'clsx';

interface GameBoardProps {
  board: string[];
  onMove: (index: number) => void;
  disabled?: boolean;
  currentPlayer?: string;
}

export function GameBoard({ board, onMove, disabled, currentPlayer }: GameBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-md aspect-square">
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => onMove(index)}
          disabled={disabled || cell !== ''}
          className={clsx(
            'aspect-square rounded-xl text-4xl sm:text-5xl md:text-6xl font-bold transition-all',
            'flex items-center justify-center',
            cell === '' && !disabled && 'hover:bg-purple-100/10',
            'bg-purple-900/10 backdrop-blur-sm',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {cell === 'X' && (
            <span className="text-pink-500">X</span>
          )}
          {cell === 'O' && (
            <span className="text-yellow-500">O</span>
          )}
        </button>
      ))}
    </div>
  );
}