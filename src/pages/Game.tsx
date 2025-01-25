import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GameBoard } from '../components/GameBoard';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  ready: boolean;
}

interface GameState {
  board: string[];
  currentPlayer: string;
  status: 'waiting' | 'in_progress' | 'completed';
  winner?: string;
}

interface Room {
  players: Player[];
  gameState: GameState;
  settings: {
    isPrivate: boolean;
    maxPlayers: number;
  };
}

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

export function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    if (roomId === 'bot') {
      setRoom({
        players: [
          {
            id: user.uid,
            name: 'You',
            symbol: 'X',
            ready: true,
          },
          {
            id: 'bot',
            name: 'Bot',
            symbol: 'O',
            ready: true,
          },
        ],
        gameState: {
          board: Array(9).fill(''),
          currentPlayer: user.uid,
          status: 'in_progress',
        },
        settings: {
          isPrivate: true,
          maxPlayers: 2,
        },
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoom(doc.data() as Room);
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, user, navigate]);

  const checkWinner = (board: string[]): string | null => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const checkDraw = (board: string[]): boolean => {
    return board.every(cell => cell !== '');
  };

  const handleMove = async (index: number) => {
    if (!room || !user || !roomId) return;

    const { board, currentPlayer, status } = room.gameState;
    if (status !== 'in_progress' || currentPlayer !== user.uid || board[index]) return;

    const newBoard = [...board];
    const currentPlayerObj = room.players.find(p => p.id === user.uid);
    if (!currentPlayerObj) return;

    newBoard[index] = currentPlayerObj.symbol;

    if (roomId === 'bot') {
      // Handle bot game
      const winner = checkWinner(newBoard);
      const isDraw = !winner && checkDraw(newBoard);

      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            board: newBoard,
            currentPlayer: 'bot',
            status: winner || isDraw ? 'completed' : 'in_progress',
            winner: winner ? user.uid : undefined
          },
        };
      });

      if (!winner && !isDraw) {
        // Simulate bot move
        setTimeout(() => {
          const emptySpots = newBoard.map((cell, i) => cell === '' ? i : -1).filter(i => i !== -1);
          if (emptySpots.length > 0) {
            const botMove = emptySpots[Math.floor(Math.random() * emptySpots.length)];
            const boardWithBotMove = [...newBoard];
            boardWithBotMove[botMove] = 'O';
            
            const botWinner = checkWinner(boardWithBotMove);
            const isBotDraw = !botWinner && checkDraw(boardWithBotMove);

            setRoom(prev => {
              if (!prev) return null;
              return {
                ...prev,
                gameState: {
                  ...prev.gameState,
                  board: boardWithBotMove,
                  currentPlayer: user.uid,
                  status: botWinner || isBotDraw ? 'completed' : 'in_progress',
                  winner: botWinner ? 'bot' : undefined
                },
              };
            });
          }
        }, 500);
      }
    } else {
      // Handle multiplayer game
      const winner = checkWinner(newBoard);
      const isDraw = !winner && checkDraw(newBoard);
      const nextPlayer = room.players.find(p => p.id !== currentPlayer)?.id;

      await updateDoc(doc(db, 'rooms', roomId), {
        'gameState.board': newBoard,
        'gameState.currentPlayer': nextPlayer,
        'gameState.status': winner || isDraw ? 'completed' : 'in_progress',
        'gameState.winner': winner ? user.uid : undefined
      });
    }
  };

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareRoom = async () => {
    if (roomId) {
      const shareUrl = `${window.location.origin}/game/${roomId}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Join my Tic Tac Toe game!',
            text: 'Click to join my game',
            url: shareUrl
          });
        } else {
          throw new Error('Web Share API not supported');
        }
      } catch (error) {
        // Fall back to copying to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Room not found</div>
      </div>
    );
  }

  const isYourTurn = room.gameState.currentPlayer === user?.uid;
  const currentPlayerSymbol = room.players.find(p => p.id === user?.uid)?.symbol;
  const winner = room.gameState.winner;
  const isDraw = room.gameState.status === 'completed' && !winner;
  const isWinner = winner === user?.uid;
  const isLoser = winner && winner !== user?.uid;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="!px-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {roomId !== 'bot' && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={copyRoomCode}
                className="!px-3"
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                onClick={shareRoom}
                className="!px-3"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {roomId !== 'bot' && (
          <div className="text-center text-white">
            <p className="text-sm">Room Code:</p>
            <p className="font-mono text-lg">{roomId}</p>
            {copied && (
              <p className="text-sm text-green-400 mt-1">Copied to clipboard!</p>
            )}
          </div>
        )}

        {room.gameState.status === 'waiting' && (
          <div className="text-center text-white">
            <p>Waiting for opponent to join...</p>
            <p className="text-sm mt-2">Share the room code to invite a player</p>
          </div>
        )}

        {room.gameState.status === 'completed' && (
          <div className="text-center text-2xl font-bold mb-4">
            {isDraw && <p className="text-yellow-400">It's a Draw!</p>}
            {isWinner && <p className="text-green-400">You Won! 🎉</p>}
            {isLoser && <p className="text-red-400">You Lost!</p>}
          </div>
        )}

        {room.gameState.status === 'in_progress' && (
          <div className="text-center text-white mb-4">
            {isYourTurn ? (
              <p className="text-lg">Your turn ({currentPlayerSymbol})</p>
            ) : (
              <p className="text-lg">Opponent's turn</p>
            )}
          </div>
        )}

        <GameBoard
          board={room.gameState.board}
          onMove={handleMove}
          disabled={!isYourTurn || room.gameState.status === 'completed'}
          currentPlayer={room.gameState.currentPlayer}
        />

        <div className="flex justify-between text-white">
          {room.players.map((player) => (
            <div key={player.id} className="text-center">
              <div className="font-semibold">{player.name}</div>
              <div className={player.symbol === 'X' ? 'text-pink-500' : 'text-yellow-500'}>
                {player.symbol}
              </div>
            </div>
          ))}
        </div>

        {room.gameState.status === 'completed' && (
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
}