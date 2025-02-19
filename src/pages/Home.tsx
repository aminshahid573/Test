import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { TowerControl as GameController, Users, Bot, Globe, Lock } from 'lucide-react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Room {
  id: string;
  players: Array<{
    id: string;
    name: string;
    symbol: 'X' | 'O';
    ready: boolean;
  }>;
  gameState: {
    status: 'waiting' | 'in_progress' | 'completed';
  };
  settings: {
    isPrivate: boolean;
    maxPlayers: number;
  };
  createdAt: any;
  ownerId: string;
}

export function Home() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPublicRooms();
    }
  }, [user]);

  const loadPublicRooms = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'rooms'),
        where('settings.isPrivate', '==', false),
        where('gameState.status', '==', 'waiting')
      );
      const snapshot = await getDocs(q);
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      rooms.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Error loading public rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
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
      ownerId: user.uid,
      createdAt: new Date()
    });

    navigate(`/game/${room.id}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/game/${joinCode.trim()}`);
    }
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
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
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
            <Globe className="w-5 h-5 mr-2 inline-block" />
            Create Public Room
          </Button>
          
          <Button
            variant="success"
            onClick={() => createRoom(true)}
            className="w-full"
          >
            <Lock className="w-5 h-5 mr-2 inline-block" />
            Create Private Room
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-300/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-purple-900 text-purple-300">or join a room</span>
            </div>
          </div>

          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-900/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button type="submit" variant="secondary">
              Join
            </Button>
          </form>

          <div className="space-y-2">
            <h2 className="text-purple-200 font-semibold">Public Rooms</h2>
            {loading ? (
              <div className="text-center text-purple-300 py-4">Loading rooms...</div>
            ) : publicRooms.length > 0 ? (
              <div className="space-y-2">
                {publicRooms.map((room) => {
                  const hostPlayer = room.players[0];
                  if (!hostPlayer) return null;
                  
                  return (
                    <button
                      key={room.id}
                      onClick={() => navigate(`/game/${room.id}`)}
                      className="w-full p-3 rounded-lg bg-purple-900/30 text-white hover:bg-purple-900/40 transition-colors flex items-center justify-between"
                    >
                      <span>
                        {hostPlayer.name}'s Room
                      </span>
                      <span className="text-purple-300 text-sm">
                        {room.players.length}/{room.settings.maxPlayers} players
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-purple-300 py-4">No public rooms available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}