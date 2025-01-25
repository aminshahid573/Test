import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { TowerControl as GameController, Users, Bot } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setError('');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    }
  };

  const createRoom = async (isPrivate: boolean) => {
    if (!user) return;

    const room = await addDoc(collection(db, 'rooms'), {
      players: [{
        id: user.uid,
        name: user.email?.split('@')[0] || `Player ${Math.floor(Math.random() * 1000)}`,
        symbol: 'X',
        ready: true
      }],
      gameState: {
        board: Array(9).fill(''),
        currentPlayer: user.uid,
        status: 'waiting'
      },
      settings: {
        isPrivate,
        maxPlayers: 2
      },
      createdAt: new Date()
    });

    navigate(`/game/${room.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
              TIC TAC TOE
            </h1>
            <p className="text-purple-200 mt-2">Please sign in to continue</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-purple-900/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-purple-900/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <Button type="submit" className="w-full">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-purple-300 text-sm hover:text-purple-200"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
            TIC TAC TOE
          </h1>
          <p className="text-purple-200">Choose your game mode</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/game/bot')}
            className="w-full"
          >
            <Bot className="w-5 h-5 mr-2 inline-block" />
            Single Player
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => createRoom(false)}
            className="w-full"
          >
            <Users className="w-5 h-5 mr-2 inline-block" />
            Multiplayer
          </Button>
          
          <Button
            variant="success"
            onClick={() => createRoom(true)}
            className="w-full"
          >
            <GameController className="w-5 h-5 mr-2 inline-block" />
            Local Multiplayer
          </Button>
        </div>
      </div>
    </div>
  );
}