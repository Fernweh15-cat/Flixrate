import React, { Component, createRef } from 'react';
import { 
  Users, Plus, Play, Pause, Send, Volume2, VolumeX, 
  MessageSquare, BarChart2, Share2, LogOut, Lock, Globe,
  Check, Film, Star, AlertCircle, HelpCircle
} from 'lucide-react';
import { fetchPopularMovies, getActiveProfile, Movie } from '../lib/tmdb';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../lib/i18n';

// Interfaces for our Watch Party page
interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    isMe: boolean;
  };
  text: string;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isTalking: boolean;
  isMuted: boolean;
}

interface PollOption {
  id: string;
  title: string;
  votes: number;
}

interface PartySession {
  id: string;
  name: string;
  movie: Movie;
  host: string;
  participantsCount: number;
  privacy: 'public' | 'friends';
  code: string;
  isPlaying: boolean;
  currentTime: number; // in seconds
  participants: Participant[];
  messages: Message[];
  poll: {
    question: string;
    options: PollOption[];
    totalVotes: number;
  };
}

interface PartyState {
  movies: Movie[];
  parties: PartySession[];
  activeParty: PartySession | null;
  loading: boolean;
  showCreateModal: boolean;
  
  // Create Form State
  formName: string;
  formMovieId: string;
  formPrivacy: 'public' | 'friends';
  
  // Live Room State
  activeTab: 'chat' | 'poll' | 'wheel' | 'invite';
  messageInput: string;
  userVotedId: string | null;
  micMuted: boolean;
  isPlaying: boolean;
  currentTime: number;
  isMuted: boolean;
  copiedCode: boolean;
  floatingEmojis: Array<{ id: number; char: string; left: number; delay: number }>;
  
  // Decision Wheel State
  wheelItems: string[];
  newItemInput: string;
  isSpinning: boolean;
  wheelWinner: string | null;
  showWheelWinnerModal: boolean;
}

const QUICK_EMOJIS = ['😍', '😂', '😮', '😢', '🔥', '👏', '🍿', '💯'];


export default class Party extends Component<{}, PartyState> {
  private chatEndRef = createRef<HTMLDivElement>();
  private canvasRef = createRef<HTMLCanvasElement>();
  private simulationInterval: NodeJS.Timeout | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private emojiIdCounter = 0;
  
  // Wheel Physics Engine
  private spinAngle = 0;
  private spinSpeed = 0;
  private animationFrameId: number | null = null;

  getBotReplies = () => {
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    if (lang === 'en-US') {
      return [
        "What a fantastic scene! This part always gives me chills. 🥶",
        "Did you notice the details of the set design? Spectacular. 🎨",
        "Did you know the actor insisted on doing this scene without a stunt double? 🎬",
        "Who wants more virtual popcorn? 🍿",
        "I love the soundtrack right now! Crazy sound design. 🔊",
        "I didn't expect this plot twist at all! 🤯",
        "Ahaha fantastic! 😂",
        "The editing here is pure art.",
        "We should definitely do a re-watch of the first movie next week! 📅",
        "This character is divinely written."
      ];
    } else if (lang === 'es-ES') {
      return [
        "¡Qué escena tan fantástica! Esta parte siempre me pone la piel de gallina. 🥶",
        "¿Notaron los detalles de la escenografía? Espectacular. 🎨",
        "¿Sabían que el actor insistió en hacer esta escena sin doble? 🎬",
        "¿Quién quiere más palomitas virtuales? 🍿",
        "¡Me encanta la banda sonora en este momento! Increíble diseño de sonido. 🔊",
        "¡No me esperaba para nada este giro de la trama! 🤯",
        "¡Jajaja fantástico! 😂",
        "El montaje aquí es puro arte.",
        "¡Deberíamos hacer un re-watch de la primera película la próxima semana! 📅",
        "Este personaje está escrito divinamente."
      ];
    }
    return [
      "Che scena fantastica! Questa parte mi fa sempre venire i brividi. 🥶",
      "Ma avete notato i dettagli della scenografia? Spettacolare. 🎨",
      "Sapevate che l'attore ha insistito per fare questa scena senza controfigura? 🎬",
      "Chi vuole altri popcorn virtuali? 🍿",
      "Adoro la colonna sonora in questo momento! Sound design pazzesco. 🔊",
      "Questa svolta di trama non me l'aspettavo proprio! 🤯",
      "Ahaha fantastico! 😂",
      "Il montaggio qui è pura arte.",
      "Dovremmo assolutamente fare un re-watch del primo film la prossima settimana! 📅",
      "Questo personaggio è scritto divinamente."
    ];
  };

  getBotParticipants = () => {
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    const aliceName = lang === 'en-US' ? 'Alice (Cinephile)' : lang === 'es-ES' ? 'Alice (Cinéfila)' : 'Alice (Cinefila)';
    return [
      { name: aliceName, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
      { name: 'Marco', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
      { name: 'Leo', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop' },
      { name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop' }
    ];
  };


  constructor(props: {}) {
    super(props);
    this.state = {
      movies: [],
      parties: [],
      activeParty: null,
      loading: true,
      showCreateModal: false,
      formName: '',
      formMovieId: '',
      formPrivacy: 'public',
      activeTab: 'chat',
      messageInput: '',
      userVotedId: null,
      micMuted: false,
      isPlaying: true,
      currentTime: 3240, // 54 minutes in
      isMuted: false,
      copiedCode: false,
      floatingEmojis: [],
      
      // Decision Wheel initial items
      wheelItems: (typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT') === 'en-US'
        ? ['Avatar 🌊', 'The Dark Knight 🦇', 'Interstellar 🚀', 'Matrix 🕶️']
        : (typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT') === 'es-ES'
        ? ['Avatar 🌊', 'El Caballero Oscuro 🦇', 'Interstellar 🚀', 'Matrix 🕶️']
        : ['Avatar 🌊', 'Il Cavaliere Oscuro 🦇', 'Interstellar 🚀', 'Matrix 🕶️'],
      newItemInput: '',
      isSpinning: false,
      wheelWinner: null,
      showWheelWinnerModal: false
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const movies = await fetchPopularMovies();
      const mockParties = this.generateMockParties(movies);
      
      this.setState({
        movies,
        parties: mockParties,
        formMovieId: movies.length > 0 ? movies[0].id : '',
        loading: false
      });
    } catch (e) {
      console.error("Error loading parties page:", e);
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    this.stopSimulation();
    this.stopPlaybackTimer();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  componentDidUpdate(prevProps: {}, prevState: PartyState) {
    if (this.state.activeParty && this.state.activeTab === 'chat' && 
        (prevState.activeParty?.messages.length !== this.state.activeParty?.messages.length || prevState.activeTab !== 'chat')) {
      this.scrollToBottom();
    }
    
    // Auto-draw Canvas Wheel if tab changed to 'wheel' or wheel items changed
    if (this.state.activeTab === 'wheel' && 
        (prevState.activeTab !== 'wheel' || prevState.wheelItems.length !== this.state.wheelItems.length || prevState.activeParty === null)) {
      setTimeout(() => {
        this.drawWheel(this.spinAngle);
      }, 50);
    }
  }

  scrollToBottom = () => {
    if (this.chatEndRef.current) {
      this.chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  generateMockParties = (movies: Movie[]): PartySession[] => {
    if (movies.length === 0) return [];
    
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    
    let name1 = '🍿 Cinefili della Notte: Maratona Cult!';
    let name2 = '🕶️ Cyberpunk & Chill - Matrix Fan Club';
    let host1 = 'Alice (Cinefila)';
    let msg1_1 = 'Ciao ragazzi! Benvenuti al Watch Party!';
    let msg1_2 = 'Questo inizio è incredibile. Adoro questo film!';
    let msg1_3 = 'Chi ha portato i popcorn virtuali? 🍿😂';
    let pollQ1 = 'Quale genere guardiamo per il prossimo party?';
    let pollO1_1 = 'Fantascienza / Sci-Fi 👽';
    let pollO1_2 = 'Thriller / Horror 🔪';
    let pollO1_3 = 'Commedia / Animazione 🎭';
    
    let msg2_1 = 'Pillola rossa o pillola blu?';
    let msg2_2 = 'Rossa, sempre. 💊🔥';
    let pollQ2 = 'Qual è il miglior film della trilogia?';
    let pollO2_1 = 'Il primo indimenticabile Matrix';
    let pollO2_2 = 'Matrix Reloaded';
    let pollO2_3 = 'Matrix Revolutions';

    if (lang === 'en-US') {
      name1 = '🍿 Night Owls: Cult Movie Marathon!';
      name2 = '🕶️ Cyberpunk & Chill - Matrix Fan Club';
      host1 = 'Alice (Cinephile)';
      msg1_1 = 'Hi guys! Welcome to the Watch Party!';
      msg1_2 = 'This intro is incredible. I love this movie!';
      msg1_3 = 'Who brought the virtual popcorn? 🍿😂';
      pollQ1 = 'Which genre should we watch for the next party?';
      pollO1_1 = 'Sci-Fi / Fantasy 👽';
      pollO1_2 = 'Thriller / Horror 🔪';
      pollO1_3 = 'Comedy / Animation 🎭';
      
      msg2_1 = 'Red pill or blue pill?';
      msg2_2 = 'Red, always. 💊🔥';
      pollQ2 = 'Which is the best movie in the trilogy?';
      pollO2_1 = 'The first unforgettable Matrix';
      pollO2_2 = 'Matrix Reloaded';
      pollO2_3 = 'Matrix Revolutions';
    } else if (lang === 'es-ES') {
      name1 = '🍿 Cinéfilos de la Noche: ¡Maratón de Culto!';
      name2 = '🕶️ Cyberpunk & Chill - Club de Fans de Matrix';
      host1 = 'Alice (Cinéfila)';
      msg1_1 = '¡Hola chicos! ¡Bienvenidos al Watch Party!';
      msg1_2 = 'Este comienzo es increíble. ¡Me encanta esta película!';
      msg1_3 = '¿Quién trajo las palomitas virtuales? 🍿😂';
      pollQ1 = '¿Qué género vemos para la próxima fiesta?';
      pollO1_1 = 'Ciencia Ficción / Sci-Fi 👽';
      pollO1_2 = 'Suspense / Terror 🔪';
      pollO1_3 = 'Comedia / Animación 🎭';
      
      msg2_1 = '¿Pastilla roja o pastilla azul?';
      msg2_2 = 'Roja, siempre. 💊🔥';
      pollQ2 = '¿Cuál es la mejor película de la trilogía?';
      pollO2_1 = 'El primer e inolvidable Matrix';
      pollO2_2 = 'Matrix Reloaded';
      pollO2_3 = 'Matrix Revolutions';
    }
    
    return [
      {
        id: 'party-1',
        name: name1,
        movie: movies[0],
        host: host1,
        participantsCount: 4,
        privacy: 'public',
        code: 'FLIX-293-NTE',
        isPlaying: true,
        currentTime: 3600,
        participants: [
          { id: 'p1', name: host1, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: false },
          { id: 'p2', name: 'Marco', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', isTalking: true, isMuted: false },
          { id: 'p3', name: 'Leo', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: true },
          { id: 'p4', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: false }
        ],
        messages: [
          { id: 'm1', sender: { name: host1, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', isMe: false }, text: msg1_1, timestamp: '21:30' },
          { id: 'm2', sender: { name: 'Marco', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', isMe: false }, text: msg1_2, timestamp: '21:32' },
          { id: 'm3', sender: { name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop', isMe: false }, text: msg1_3, timestamp: '21:35' }
        ],
        poll: {
          question: pollQ1,
          options: [
            { id: 'o1', title: pollO1_1, votes: 12 },
            { id: 'o2', title: pollO1_2, votes: 8 },
            { id: 'o3', title: pollO1_3, votes: 4 }
          ],
          totalVotes: 24
        }
      },
      {
        id: 'party-2',
        name: name2,
        movie: movies[Math.min(2, movies.length - 1)],
        host: 'CyberNeo',
        participantsCount: 2,
        privacy: 'public',
        code: 'FLIX-884-MTX',
        isPlaying: true,
        currentTime: 2400,
        participants: [
          { id: 'p5', name: 'CyberNeo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop', isTalking: true, isMuted: false },
          { id: 'p6', name: 'Trinity', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: false }
        ],
        messages: [
          { id: 'm4', sender: { name: 'CyberNeo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop', isMe: false }, text: msg2_1, timestamp: '22:05' },
          { id: 'm5', sender: { name: 'Trinity', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop', isMe: false }, text: msg2_2, timestamp: '22:06' }
        ],
        poll: {
          question: pollQ2,
          options: [
            { id: 'o4', title: pollO2_1, votes: 20 },
            { id: 'o5', title: pollO2_2, votes: 4 },
            { id: 'o6', title: pollO2_3, votes: 1 }
          ],
          totalVotes: 25
        }
      }
    ];
  };

  // Start continuous simulation of other users in the room
  startSimulation = () => {
    this.stopSimulation();
    
    // Periodically (every 18 seconds) simulate a friend sending a message
    this.simulationInterval = setInterval(() => {
      const { activeParty } = this.state;
      if (!activeParty) return;

      const botParticipants = this.getBotParticipants();
      const botReplies = this.getBotReplies();
      const randomFriend = botParticipants[Math.floor(Math.random() * botParticipants.length)];
      const randomText = botReplies[Math.floor(Math.random() * botReplies.length)];
      
      // Also trigger a random floating emoji on screen
      if (Math.random() > 0.3) {
        this.triggerFloatingEmoji(QUICK_EMOJIS[Math.floor(Math.random() * QUICK_EMOJIS.length)]);
      }

      // Simulate mic talking indicator
      const updatedParticipants = activeParty.participants.map(p => {
        if (p.name.includes(randomFriend.name.split(' ')[0])) {
          return { ...p, isTalking: true };
        }
        return { ...p, isTalking: false };
      });

      this.setState(prevState => {
        if (!prevState.activeParty) return null;
        
        const timestamp = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const newMessage: Message = {
          id: 'sim-' + Date.now(),
          sender: {
            name: randomFriend.name,
            avatar: randomFriend.avatar,
            isMe: false
          },
          text: randomText,
          timestamp
        };

        const updatedParty = {
          ...prevState.activeParty,
          participants: updatedParticipants,
          messages: [...prevState.activeParty.messages, newMessage]
        };

        return { activeParty: updatedParty };
      });

      // Clear the talking glow ring after 3 seconds
      setTimeout(() => {
        const { activeParty: currentParty } = this.state;
        if (!currentParty) return;
        const clearedParticipants = currentParty.participants.map(p => ({ ...p, isTalking: false }));
        this.setState({
          activeParty: { ...currentParty, participants: clearedParticipants }
        });
      }, 3000);

    }, 18000);
  };

  stopSimulation = () => {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  };

  // Start continuous movie time counter
  startPlaybackTimer = () => {
    this.stopPlaybackTimer();
    this.timerInterval = setInterval(() => {
      const { isPlaying, currentTime } = this.state;
      if (isPlaying) {
        this.setState({ currentTime: currentTime + 1 });
      }
    }, 1000);
  };

  stopPlaybackTimer = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  };

  // Format seconds to HH:MM:SS
  formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Handle entering a party room
  handleJoinParty = (party: PartySession) => {
    const userProfile = getActiveProfile();
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    const meLabel = lang === 'en-US' ? 'You' : lang === 'es-ES' ? 'Tú' : 'Tu';
    
    const myParticipant: Participant = {
      id: 'me-' + Date.now(),
      name: `${userProfile.name} (${meLabel})`,
      avatar: userProfile.avatar,
      isTalking: false,
      isMuted: this.state.micMuted
    };

    // Add user to the participants if they aren't already there
    const hasMe = party.participants.some(p => p.id.startsWith('me-'));
    const updatedParticipants = hasMe ? party.participants : [...party.participants, myParticipant];
    
    const activeParty = {
      ...party,
      participants: updatedParticipants
    };

    const joinWheelItems = lang === 'en-US'
      ? ['Avatar 🌊', 'The Dark Knight 🦇', 'Interstellar 🚀', 'Matrix 🕶️', 'Inception 🌀']
      : lang === 'es-ES'
      ? ['Avatar 🌊', 'El Caballero Oscuro 🦇', 'Interstellar 🚀', 'Matrix 🕶️', 'Inception 🌀']
      : ['Avatar 🌊', 'Il Cavaliere Oscuro 🦇', 'Interstellar 🚀', 'Matrix 🕶️', 'Inception 🌀'];

    this.setState({
      activeParty,
      isPlaying: party.isPlaying,
      currentTime: party.currentTime,
      userVotedId: null,
      wheelItems: joinWheelItems,
      wheelWinner: null,
      showWheelWinnerModal: false
    }, () => {
      this.startSimulation();
      this.startPlaybackTimer();
    });
  };

  handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    const { formName, formMovieId, formPrivacy, movies } = this.state;
    
    if (formName.trim() === '') return;
    
    const selectedMovie = movies.find(m => String(m.id) === String(formMovieId)) || movies[0];
    const userProfile = getActiveProfile();
    
    const code = 'FLIX-' + Math.floor(100 + Math.random() * 900) + '-' + selectedMovie.title.slice(0, 3).toUpperCase();
    
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    const meLabel = lang === 'en-US' ? 'You' : lang === 'es-ES' ? 'Tú' : 'Tu';
    
    let botWelcome = `Benvenuto nella stanza "${formName}"! Invita i tuoi amici condividendo il codice: ${code} 🍿`;
    let defaultPollQ = 'Cosa guardiamo dopo?';
    let opt1 = 'Il cavaliere oscuro 🦇';
    let opt2 = 'Interstellar 🚀';
    let opt3 = 'Pulp Fiction 🍔';
    
    if (lang === 'en-US') {
      botWelcome = `Welcome to the room "${formName}"! Invite your friends by sharing the code: ${code} 🍿`;
      defaultPollQ = 'What should we watch next?';
      opt1 = 'The Dark Knight 🦇';
      opt2 = 'Interstellar 🚀';
      opt3 = 'Pulp Fiction 🍔';
    } else if (lang === 'es-ES') {
      botWelcome = `¡Bienvenido a la sala "${formName}"! Invita a tus amigos compartiendo el código: ${code} 🍿`;
      defaultPollQ = '¿Qué vemos después?';
      opt1 = 'El caballero oscuro 🦇';
      opt2 = 'Interstellar 🚀';
      opt3 = 'Pulp Fiction 🍔';
    }

    const newParty: PartySession = {
      id: 'party-' + Date.now(),
      name: formName,
      movie: selectedMovie,
      host: userProfile.name,
      participantsCount: 1,
      privacy: formPrivacy,
      code,
      isPlaying: true,
      currentTime: 0,
      participants: [
        { id: 'me-' + Date.now(), name: `${userProfile.name} (${meLabel})`, avatar: userProfile.avatar, isTalking: false, isMuted: false },
        { id: 'p-sofia', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: false },
        { id: 'p-marco', name: 'Marco', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', isTalking: false, isMuted: false }
      ],
      messages: [
        { 
          id: 'welcome', 
          sender: { name: 'Flixrate Bot', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop', isMe: false }, 
          text: botWelcome, 
          timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
        }
      ],
      poll: {
        question: defaultPollQ,
        options: [
          { id: 'po-1', title: opt1, votes: 0 },
          { id: 'po-2', title: opt2, votes: 0 },
          { id: 'po-3', title: opt3, votes: 0 }
        ],
        totalVotes: 0
      }
    };

    const newWheelItems = lang === 'en-US'
      ? [selectedMovie.title + ' 🎥', 'Inception 🌀', 'Pulp Fiction 🍔', 'Interstellar 🚀']
      : lang === 'es-ES'
      ? [selectedMovie.title + ' 🎥', 'Inception 🌀', 'Pulp Fiction 🍔', 'Interstellar 🚀']
      : [selectedMovie.title + ' 🎥', 'Inception 🌀', 'Pulp Fiction 🍔', 'Interstellar 🚀'];

    this.setState(prevState => ({
      parties: [newParty, ...prevState.parties],
      activeParty: newParty,
      showCreateModal: false,
      formName: '',
      isPlaying: true,
      currentTime: 0,
      userVotedId: null,
      wheelItems: newWheelItems,
      wheelWinner: null,
      showWheelWinnerModal: false
    }), () => {
      this.startSimulation();
      this.startPlaybackTimer();
    });
  };

  // Handle leaving the party
  handleLeaveParty = () => {
    this.stopSimulation();
    this.stopPlaybackTimer();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.setState({
      activeParty: null,
      floatingEmojis: []
    });
  };

  // Send a message to chat
  handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { messageInput, activeParty } = this.state;
    if (messageInput.trim() === '' || !activeParty) return;

    const userProfile = getActiveProfile();
    const timestamp = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      sender: {
        name: userProfile.name,
        avatar: userProfile.avatar,
        isMe: true
      },
      text: messageInput,
      timestamp
    };

    const updatedParty = {
      ...activeParty,
      messages: [...activeParty.messages, userMessage]
    };

    this.setState({
      activeParty: updatedParty,
      messageInput: ''
    }, () => {
      // Auto reply from a simulated friend after 1.5 seconds
      setTimeout(() => {
        const { activeParty: currentParty } = this.state;
        if (!currentParty) return;

        const botParticipants = this.getBotParticipants();
        const botReplies = this.getBotReplies();
        const randomBotFriend = botParticipants[Math.floor(Math.random() * botParticipants.length)];
        const replyText = botReplies[Math.floor(Math.random() * botReplies.length)];
        const replyTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // Highlight bot is talking
        const talkingParticipants = currentParty.participants.map(p => {
          if (p.name.includes(randomBotFriend.name.split(' ')[0])) {
            return { ...p, isTalking: true };
          }
          return p;
        });

        const botMsg: Message = {
          id: 'bot-' + Date.now(),
          sender: {
            name: randomBotFriend.name,
            avatar: randomBotFriend.avatar,
            isMe: false
          },
          text: replyText,
          timestamp: replyTime
        };

        this.setState({
          activeParty: {
            ...currentParty,
            participants: talkingParticipants,
            messages: [...currentParty.messages, botMsg]
          }
        });

        // Turn off speaker ring
        setTimeout(() => {
          const { activeParty: partyNow } = this.state;
          if (!partyNow) return;
          const silentParticipants = partyNow.participants.map(p => ({ ...p, isTalking: false }));
          this.setState({
            activeParty: { ...partyNow, participants: silentParticipants }
          });
        }, 3000);

      }, 1500);
    });
  };

  // Trigger floating emoji animation
  triggerFloatingEmoji = (emoji: string) => {
    const id = ++this.emojiIdCounter;
    // Random horizontal position (15% to 85% width) and random transition delay
    const left = Math.floor(15 + Math.random() * 70);
    const delay = Math.random() * 0.2;
    
    const newEmoji = { id, char: emoji, left, delay };
    
    this.setState(prevState => ({
      floatingEmojis: [...prevState.floatingEmojis, newEmoji]
    }));

    // Remove from state after animation finishes (approx 3 seconds)
    setTimeout(() => {
      this.setState(prevState => ({
        floatingEmojis: prevState.floatingEmojis.filter(e => e.id !== id)
      }));
    }, 3000);
  };

  // Handle vote inside poll
  handleVotePoll = (optionId: string) => {
    const { activeParty, userVotedId } = this.state;
    if (!activeParty || userVotedId) return; // Only one vote allowed

    const updatedOptions = activeParty.poll.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    const updatedParty = {
      ...activeParty,
      poll: {
        ...activeParty.poll,
        options: updatedOptions,
        totalVotes: activeParty.poll.totalVotes + 1
      }
    };

    this.setState({
      activeParty: updatedParty,
      userVotedId: optionId
    }, () => {
      // Simulate 2 more friends voting on random options after 2.5 seconds to show dynamic bar growth
      setTimeout(() => {
        const { activeParty: latestParty } = this.state;
        if (!latestParty) return;

        const randomIndex1 = Math.floor(Math.random() * latestParty.poll.options.length);
        const randomIndex2 = Math.floor(Math.random() * latestParty.poll.options.length);

        const simulatedVotesOptions = latestParty.poll.options.map((opt, index) => {
          let addedVotes = 0;
          if (index === randomIndex1) addedVotes++;
          if (index === randomIndex2) addedVotes++;
          return { ...opt, votes: opt.votes + addedVotes };
        });

        this.setState({
          activeParty: {
            ...latestParty,
            poll: {
              ...latestParty.poll,
              options: simulatedVotesOptions,
              totalVotes: latestParty.poll.totalVotes + (randomIndex1 === randomIndex2 ? 1 : 2)
            }
          }
        });
      }, 2500);
    });
  };

  // Copy party invite code to clipboard
  handleCopyCode = () => {
    const { activeParty } = this.state;
    if (!activeParty) return;
    
    navigator.clipboard.writeText(activeParty.code);
    this.setState({ copiedCode: true });
    
    setTimeout(() => {
      this.setState({ copiedCode: false });
    }, 2000);
  };

  // Toggle user microphone status
  toggleMic = () => {
    const { activeParty, micMuted } = this.state;
    const nextMic = !micMuted;
    
    this.setState({ micMuted: nextMic });
    
    if (activeParty) {
      const updatedParticipants = activeParty.participants.map(p => {
        if (p.id.startsWith('me-')) {
          return { ...p, isMuted: nextMic };
        }
        return p;
      });
      
      this.setState({
        activeParty: {
          ...activeParty,
          participants: updatedParticipants
        }
      });
    }
  };

  // ==========================================
  // DECISION WHEEL CUSTOM FUNCTIONS (CANVAS)
  // ==========================================

  // Draw the custom Decision Wheel on Canvas
  drawWheel = (currentAngle: number) => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 15;

    ctx.clearRect(0, 0, width, height);

    const { wheelItems } = this.state;
    const totalSlices = wheelItems.length;
    
    if (totalSlices === 0) {
      // Draw empty wheel state
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e1e24';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2d2d38';
      ctx.stroke();
      
      ctx.fillStyle = '#8e8e9f';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('party_wheel_empty_desc').split('.')[0] + '!', cx, cy);
      return;
    }

    const sliceAngle = (2 * Math.PI) / totalSlices;

    // Premium themed color palette for segments
    const colors = [
      '#e50914', // Flixrate Red
      '#1e1b4b', // Indigo Deep Blue
      '#0f766e', // Teal Green
      '#b45309', // Amber Orange
      '#312e81', // Dark Indigo
      '#4c1d95', // Purple
      '#065f46', // Emerald
      '#701a75'  // Deep Pink
    ];

    for (let i = 0; i < totalSlices; i++) {
      const startAngle = currentAngle + i * sliceAngle;
      const endAngle = currentAngle + (i + 1) * sliceAngle;

      // Draw sector slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Fine outline overlay
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Draw movie title text inside slice
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      const fontSize = totalSlices > 8 ? '9px' : totalSlices > 5 ? '11px' : '13px';
      ctx.font = `bold ${fontSize} sans-serif`;
      
      let text = wheelItems[i];
      if (text.length > 18) text = text.slice(0, 15) + '...';
      
      ctx.fillText(text, radius - 15, 0);
      ctx.restore();
    }

    // Draw Glossy Center Hub Overlay
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e50914';
    ctx.stroke();

    // Draw small gold center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // Draw indicator arrow pointing down at the top center
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 5);
    ctx.lineTo(cx - 10, cy - radius - 22);
    ctx.lineTo(cx + 10, cy - radius - 22);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24'; // Gold pointer
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  };

  // Physics-based wheel spinning logic
  spinWheel = () => {
    const { isSpinning, wheelItems } = this.state;
    if (isSpinning || wheelItems.length === 0) return;

    this.setState({ 
      isSpinning: true, 
      wheelWinner: null, 
      showWheelWinnerModal: false 
    });

    // Generate randomized initial speed (0.4 to 0.65 radians/frame)
    this.spinSpeed = 0.45 + Math.random() * 0.2;
    this.animateSpin();
  };

  animateSpin = () => {
    this.spinAngle += this.spinSpeed;
    this.spinSpeed *= 0.985; // simulate slowing friction deceleration

    this.drawWheel(this.spinAngle);

    if (this.spinSpeed > 0.001) {
      this.animationFrameId = requestAnimationFrame(this.animateSpin);
    } else {
      // Stopped spinning
      const { wheelItems } = this.state;
      const totalSlices = wheelItems.length;
      const sliceAngle = (2 * Math.PI) / totalSlices;

      // Pointer is at -Math.PI / 2 (top). Normalize stopping angle
      let angleNormalized = (1.5 * Math.PI - this.spinAngle) % (2 * Math.PI);
      if (angleNormalized < 0) {
        angleNormalized += 2 * Math.PI;
      }

      const winnerIndex = Math.floor(angleNormalized / sliceAngle) % totalSlices;
      const winner = wheelItems[winnerIndex];

      this.setState({
        isSpinning: false,
        wheelWinner: winner,
        showWheelWinnerModal: true
      });
    }
  };

  // Add custom movie item to the wheel
  handleAddWheelItem = (e: React.FormEvent) => {
    e.preventDefault();
    const { newItemInput, wheelItems } = this.state;
    if (newItemInput.trim() === '') return;

    const updatedItems = [...wheelItems, newItemInput.trim()];
    this.setState({
      wheelItems: updatedItems,
      newItemInput: ''
    }, () => {
      this.drawWheel(this.spinAngle);
    });
  };

  // Remove movie item from the wheel
  handleRemoveWheelItem = (index: number) => {
    const { wheelItems } = this.state;
    const updatedItems = wheelItems.filter((_, i) => i !== index);
    this.setState({
      wheelItems: updatedItems
    }, () => {
      this.drawWheel(this.spinAngle);
    });
  };

  render() {
    const { 
      movies, parties, activeParty, loading, showCreateModal,
      formName, formMovieId, formPrivacy, activeTab, messageInput,
      userVotedId, micMuted, isPlaying, currentTime, isMuted, copiedCode,
      floatingEmojis, wheelItems, newItemInput, isSpinning, wheelWinner,
      showWheelWinnerModal 
    } = this.state;

    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-brand border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-muted font-bold text-sm uppercase tracking-widest animate-pulse">{t('party_loading')}</p>
          </div>
        </div>
      );
    }

    // --- MAIN SCREEN 1: DASHBOARD PARTY LIST ---
    if (!activeParty) {
      return (
        <div className="flex flex-col gap-12 pb-32 pt-24 md:pt-16">
          {/* Header Hero Banner */}
          <section className="relative overflow-hidden rounded-[30px] md:rounded-[45px] bg-gradient-to-br from-primary-brand/20 via-surface to-background border border-surface-high/30 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-brand/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="space-y-6 max-w-2xl text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-brand/10 border border-primary-brand/30 rounded-full text-primary-brand font-black text-[10px] uppercase tracking-widest">
                {t('party_live_feature')}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
                FLIXRATE <span className="text-primary-brand">{t('party_title')}</span>
              </h1>
              <p className="text-text-muted text-base md:text-lg max-w-lg leading-relaxed">
                {t('party_hero_desc')}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button 
                  onClick={() => this.setState({ showCreateModal: true })}
                  className="bg-primary-brand hover:bg-primary-brand-hover text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] cursor-pointer"
                >
                  <Plus size={20} /> {t('party_create_btn')}
                </button>
                <div className="flex items-center bg-surface-high border border-surface-high rounded-xl p-1 max-w-[280px]">
                  <input 
                    type="text" 
                    placeholder={t('party_join_code_placeholder')} 
                    className="bg-transparent border-0 text-white font-bold px-4 py-2 text-sm w-full focus:outline-none placeholder:text-text-muted"
                  />
                  <button 
                    onClick={() => {
                      if (parties.length > 0) {
                        this.handleJoinParty(parties[0]);
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {t('party_join_confirm')}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[320px] aspect-[4/3] bg-surface-high/40 border border-surface-high rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-surface-high pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-text-main font-bold uppercase tracking-wider">{t('party_active_rooms')}</span>
                </div>
                <Users size={16} className="text-text-muted" />
              </div>
              <div className="space-y-4 my-6">
                <div className="flex -space-x-3 overflow-hidden">
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" alt="" />
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" alt="" />
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" alt="" />
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-brand text-white text-xs font-black ring-2 ring-surface">+18</div>
                </div>
                <p className="text-xs text-text-muted font-medium" dangerouslySetInnerHTML={{ __html: t('party_users_online_desc', { count: 22 }) }} />
              </div>
              <div className="text-[10px] uppercase text-primary-brand tracking-widest font-black">
                {t('party_community_cta')}
              </div>
            </div>
          </section>

          {/* Active Parties List */}
          <section className="space-y-6">
            <div className="flex items-end justify-between px-margin-mobile md:px-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2">
                  <Users size={24} className="text-primary-brand" />
                  {t('party_active_rooms')}
                </h2>
                <p className="text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">{t('party_public_rooms_desc')}</p>
              </div>
            </div>

            {parties.length === 0 ? (
              <div className="bg-surface border border-surface-high/30 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                <AlertCircle className="w-12 h-12 text-text-muted" />
                <p className="text-text-main font-bold text-lg">{t('party_no_rooms')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-margin-mobile md:px-0">
                {parties.map((party) => (
                  <div 
                    key={party.id}
                    className="group bg-surface hover:bg-surface-high border border-surface-high/40 hover:border-primary-brand/30 rounded-3xl overflow-hidden p-6 flex gap-6 transition-all duration-300 shadow-lg hover:shadow-2xl"
                  >
                    {/* Poster thumbnail */}
                    <div className="relative w-28 md:w-32 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0">
                      <img 
                        src={party.movie.poster} 
                        alt={party.movie.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white font-black text-[9px] rounded-md tracking-wider flex items-center gap-1 shadow-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        LIVE
                      </div>
                    </div>

                    {/* Party Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase text-primary-brand tracking-widest bg-primary-brand/10 border border-primary-brand/20 px-2.5 py-0.5 rounded-md">
                            {party.privacy === 'public' ? t('party_privacy_public') : t('party_privacy_friends')}
                          </span>
                          <span className="text-xs text-text-muted font-bold flex items-center gap-1">
                            <Users size={12} /> {t('party_room_users', { count: party.participantsCount })}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white group-hover:text-primary-brand transition-colors tracking-tight line-clamp-1">
                          {party.name}
                        </h3>
                        <p className="text-xs text-text-muted font-semibold mt-1 flex items-center gap-1 uppercase">
                          <Film size={12} className="text-primary-brand" /> {party.movie.title} ({party.movie.year})
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                          {t('party_room_host', { host: '' })} <strong className="text-text-main font-bold">{party.host}</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-surface-high/50 pt-4 mt-4">
                        <div className="flex -space-x-2">
                          {party.participants.slice(0, 3).map((p, i) => (
                            <img 
                              key={i} 
                              src={p.avatar} 
                              alt={p.name} 
                              className="w-7 h-7 rounded-full border border-surface object-cover" 
                            />
                          ))}
                          {party.participants.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-surface-high border border-surface flex items-center justify-center text-[10px] font-bold text-text-main">
                              +{party.participants.length - 3}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => this.handleJoinParty(party)}
                          className="bg-primary-brand hover:bg-primary-brand-hover text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(229,9,20,0.3)]"
                        >
                          <Play size={12} fill="currentColor" /> {t('party_room_join')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CREATE PARTY MODAL */}
          <AnimatePresence>
            {showCreateModal && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-surface border border-surface-high rounded-[32px] w-full max-w-xl p-8 relative shadow-2xl"
                >
                  <button 
                    onClick={() => this.setState({ showCreateModal: false })}
                    className="absolute top-6 right-6 text-text-muted hover:text-white font-bold p-2 text-xl rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>

                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2.5 mb-6">
                    <Plus className="text-primary-brand" /> {t('party_create_modal_title')}
                  </h2>

                  <form onSubmit={this.handleCreateParty} className="space-y-6">
                    {/* Party Name Input */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-black tracking-widest text-text-muted">{t('party_room_name')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={t('party_room_name_placeholder')}
                        value={formName}
                        onChange={(e) => this.setState({ formName: e.target.value })}
                        className="w-full bg-surface-high border border-surface-high focus:border-primary-brand/50 rounded-xl px-5 py-3 text-white font-semibold focus:outline-none transition-colors placeholder:text-text-muted"
                      />
                    </div>

                    {/* Movie Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-black tracking-widest text-text-muted">{t('party_select_movie')}</label>
                      <select 
                        value={formMovieId}
                        onChange={(e) => this.setState({ formMovieId: e.target.value })}
                        className="w-full bg-surface-high border border-surface-high focus:border-primary-brand/50 rounded-xl px-5 py-3 text-white font-semibold focus:outline-none transition-colors"
                      >
                        {movies.map((movie) => (
                          <option key={movie.id} value={movie.id} className="bg-surface font-semibold text-white">
                            {movie.title} ({movie.year})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Privacy Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-black tracking-widest text-text-muted">{t('party_room_privacy')}</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => this.setState({ formPrivacy: 'public' })}
                          className={`flex items-center justify-center gap-2 p-4 rounded-xl border font-bold transition-all cursor-pointer ${formPrivacy === 'public' ? 'border-primary-brand bg-primary-brand/10 text-white' : 'border-surface-high bg-surface-high/30 text-text-muted hover:border-surface-high'}`}
                        >
                          <Globe size={16} /> {t('party_privacy_public')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => this.setState({ formPrivacy: 'friends' })}
                          className={`flex items-center justify-center gap-2 p-4 rounded-xl border font-bold transition-all cursor-pointer ${formPrivacy === 'friends' ? 'border-primary-brand bg-primary-brand/10 text-white' : 'border-surface-high bg-surface-high/30 text-text-muted hover:border-surface-high'}`}
                        >
                          <Lock size={16} /> {t('party_privacy_friends')}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => this.setState({ showCreateModal: false })}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all cursor-pointer"
                      >
                        {t('party_create_cancel')}
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 bg-primary-brand hover:bg-primary-brand-hover text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:scale-105 cursor-pointer active:scale-95"
                      >
                        {t('party_create_confirm')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // --- MAIN SCREEN 2: ACTIVE LIVE WATCH PARTY ROOM ---
    const party = activeParty;
    const elapsedPercent = (currentTime / 7200) * 100; // Let's simulate standard 2h movie (7200s)

    return (
      <div className="min-h-screen flex flex-col lg:flex-row gap-6 pt-24 md:pt-16 pb-20 lg:pb-0 h-screen lg:overflow-hidden -mx-margin-mobile md:-mx-margin-desktop bg-background selection:bg-primary-brand">
        
        {/* LEFT PANEL: CINEMA PLAYER & MEMBERS (70% width on Desktop) */}
        <div className="flex-1 flex flex-col gap-6 px-4 lg:pl-10 lg:pr-2 py-4 lg:h-full lg:overflow-y-auto no-scrollbar">
          
          {/* Room Header Info */}
          <div className="flex items-center justify-between border-b border-surface-high/40 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={this.handleLeaveParty}
                  className="p-2 bg-white/5 hover:bg-white/10 hover:text-primary-brand rounded-lg text-text-muted transition-all cursor-pointer"
                  title={t('party_leave_room')}
                >
                  <LogOut size={18} />
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight italic uppercase flex items-center gap-2">
                    {party.name}
                  </h1>
                  <p className="text-xs text-text-muted mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                    🎥 {t('party_room_watching', { movie: '' })} <strong className="text-primary-brand">{party.movie.title}</strong>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Invite Button Shortcut */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => this.setState({ activeTab: 'wheel' })}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-primary-brand/20 border border-primary-brand/30 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                🎡 {t('party_tab_wheel')}
              </button>
              <button 
                onClick={this.handleCopyCode}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-surface hover:bg-surface-high border border-surface-high text-text-main'}`}
              >
                {copiedCode ? <Check size={14} /> : <Share2 size={14} />}
                {copiedCode ? t('party_copied') : t('party_code_btn')}
              </button>
            </div>
          </div>

          {/* SIMULATED CINEMA SCREEN PLAYER */}
          <div className="relative aspect-video w-full bg-black rounded-[28px] overflow-hidden border border-surface-high shadow-2xl group">
            
            {/* Backdrop Image */}
            <img 
              src={party.movie.backdrop || party.movie.poster} 
              alt={party.movie.title} 
              className={`w-full h-full object-cover select-none transition-all duration-700 ${isPlaying ? 'scale-100 filter brightness-90' : 'scale-105 filter brightness-50'}`}
            />
            
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* FLOATING EMOJI CANVAS OVERLAY */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              <AnimatePresence>
                {floatingEmojis.map((emoji) => (
                  <motion.div
                    key={emoji.id}
                    initial={{ y: '100%', opacity: 0, scale: 0.5, x: `${emoji.left}%` }}
                    animate={{ 
                      y: '-10%', 
                      opacity: [0, 1, 1, 0],
                      scale: [0.8, 1.4, 1.4, 0.9],
                      x: [
                        `${emoji.left}%`, 
                        `${emoji.left + (Math.random() > 0.5 ? 8 : -8)}%`, 
                        `${emoji.left + (Math.random() > 0.5 ? 12 : -12)}%`
                      ]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 2.8, 
                      ease: 'easeOut',
                      delay: emoji.delay
                    }}
                    className="absolute bottom-0 text-4xl select-none"
                  >
                    {emoji.char}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Play/Pause Overlay indicator */}
            {!isPlaying && (
              <div 
                onClick={() => this.setState({ isPlaying: true })}
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/40 hover:bg-black/30 transition-colors"
              >
                <div className="w-20 h-20 bg-primary-brand text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(229,9,20,0.6)] transform hover:scale-110 active:scale-95 transition-all">
                  <Play size={36} fill="currentColor" className="ml-2" />
                </div>
              </div>
            )}

            {/* Video Custom Controller Bar */}
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
              
              {/* Timeline Seeker slider */}
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] md:text-xs text-white font-mono">{this.formatTime(currentTime)}</span>
                <div className="flex-1 relative h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary-brand rounded-full transition-all"
                    style={{ width: `${elapsedPercent}%` }}
                  />
                </div>
                <span className="text-[10px] md:text-xs text-white font-mono">{this.formatTime(7200)}</span>
              </div>

              {/* Lower controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button 
                    onClick={() => this.setState({ isPlaying: !isPlaying })}
                    className="text-white hover:text-primary-brand transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  
                  {/* Volume Toggle */}
                  <button 
                    onClick={() => this.setState({ isMuted: !isMuted })}
                    className="text-white hover:text-primary-brand transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">{t('party_sync_status')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* VOICE ROOM / PARTICIPANTS GRID */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-text-muted tracking-widest">{t('party_voice_room', { count: party.participants.length })}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {party.participants.map((p) => {
                const isTalking = p.isTalking && !p.isMuted;
                return (
                  <div 
                    key={p.id}
                    className={`bg-surface border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${isTalking ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-surface-high/40' : 'border-surface-high/40'}`}
                  >
                    <div className="relative">
                      <img 
                        src={p.avatar} 
                        alt={p.name} 
                        className={`w-14 h-14 rounded-full object-cover border-2 transition-all ${isTalking ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent'}`}
                      />
                      
                      {/* Audio status dot indicator */}
                      {p.isMuted ? (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 border border-surface shadow-md">
                          <VolumeX size={10} />
                        </div>
                      ) : isTalking ? (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border border-surface shadow-md animate-bounce">
                          <Volume2 size={10} className="text-white" />
                        </div>
                      ) : null}
                    </div>

                    <h4 className="text-sm font-black text-white mt-3 truncate w-full px-2">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mt-0.5">
                      {p.id.startsWith('me-') ? (lang === 'en-US' ? 'You' : lang === 'es-ES' ? 'Tú' : 'Tu') : p.id === 'p1' ? 'Host' : (lang === 'en-US' ? 'Friend' : lang === 'es-ES' ? 'Amigo' : 'Amico')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mic Toggle control bar */}
            <div className="flex justify-between items-center bg-surface border border-surface-high/50 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-text-main">{t('party_voice_connected')}</span>
              </div>
              <button 
                onClick={this.toggleMic}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${micMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-surface-high hover:bg-white/10 text-white border border-surface-high'}`}
              >
                {micMuted ? t('party_mic_mute') : t('party_mic_unmute')}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: INTERACTIVE TABS (CHAT & POLL & DECISION WHEEL & INVITE) - 30% width on Desktop */}
        <div className="w-full lg:w-96 bg-surface border-t lg:border-t-0 lg:border-l border-surface-high flex flex-col lg:h-full flex-shrink-0">
          
          {/* Tab Menu Selector */}
          <div className="flex border-b border-surface-high">
            <button 
              onClick={() => this.setState({ activeTab: 'chat' })}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${activeTab === 'chat' ? 'border-primary-brand text-white' : 'border-transparent text-text-muted hover:text-text-main'}`}
            >
              <MessageSquare size={14} /> <span>{t('party_chat_tab')} ({party.messages.length})</span>
            </button>
            
            <button 
              onClick={() => this.setState({ activeTab: 'poll' })}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${activeTab === 'poll' ? 'border-primary-brand text-white' : 'border-transparent text-text-muted hover:text-text-main'}`}
            >
              <BarChart2 size={14} /> <span>{t('party_tab_vote')}</span>
            </button>

            <button 
              onClick={() => this.setState({ activeTab: 'wheel' })}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${activeTab === 'wheel' ? 'border-primary-brand text-white' : 'border-transparent text-text-muted hover:text-text-main'}`}
            >
              <HelpCircle size={14} /> <span>{t('party_tab_wheel')} 🎡</span>
            </button>

            <button 
              onClick={() => this.setState({ activeTab: 'invite' })}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${activeTab === 'invite' ? 'border-primary-brand text-white' : 'border-transparent text-text-muted hover:text-text-main'}`}
            >
              <Share2 size={14} /> <span>{t('party_tab_invite')}</span>
            </button>
          </div>

          {/* TAB 1: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-[400px] lg:h-full lg:overflow-hidden">
              
              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar lg:h-[calc(100vh-270px)]">
                {party.messages.map((msg) => {
                  const isMe = msg.sender.isMe;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <img 
                        src={msg.sender.avatar} 
                        alt={msg.sender.name} 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />

                      {/* Content bubble */}
                      <div>
                        <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] font-bold text-text-main truncate max-w-[120px]">
                            {msg.sender.name}
                          </span>
                          <span className="text-[9px] text-text-muted font-medium">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-sm font-semibold leading-relaxed ${isMe ? 'bg-primary-brand text-white rounded-tr-none' : 'bg-surface-high text-text-main rounded-tl-none border border-surface-high/30'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={this.chatEndRef} />
              </div>

              {/* Chat Quick Reactions bar */}
              <div className="px-4 py-2 border-t border-surface-high/30 flex gap-2 overflow-x-auto no-scrollbar bg-surface/50">
                {QUICK_EMOJIS.map((emoji) => (
                  <button 
                    key={emoji}
                    onClick={() => this.triggerFloatingEmoji(emoji)}
                    className="hover:scale-125 transition-transform duration-200 cursor-pointer p-1 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form 
                onSubmit={this.handleSendMessage}
                className="p-4 border-t border-surface-high flex gap-2 bg-surface"
              >
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => this.setState({ messageInput: e.target.value })}
                  placeholder={t('party_chat_placeholder')} 
                  className="flex-1 bg-surface-high border border-surface-high focus:border-primary-brand/50 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none transition-colors placeholder:text-text-muted"
                />
                <button 
                  type="submit"
                  className="bg-primary-brand hover:bg-primary-brand-hover text-white p-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                >
                  <Send size={18} fill="currentColor" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE GROUP POLL */}
          {activeTab === 'poll' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="bg-surface-high/30 border border-surface-high rounded-2xl p-5 space-y-4">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-brand/10 border border-primary-brand/20 rounded text-primary-brand font-black text-[9px] uppercase tracking-widest">
                  {t('party_poll_title')}
                </div>
                <h3 className="text-lg font-black text-white tracking-tight leading-snug">
                  {party.poll.question}
                </h3>
              </div>

              {/* Poll Options voting list */}
              <div className="space-y-4">
                {party.poll.options.map((opt) => {
                  const votePercentage = party.poll.totalVotes > 0 
                    ? Math.round((opt.votes / party.poll.totalVotes) * 100) 
                    : 0;
                  
                  const isSelected = userVotedId === opt.id;
                  
                  return (
                    <button 
                      key={opt.id}
                      onClick={() => this.handleVotePoll(opt.id)}
                      disabled={!!userVotedId}
                      className={`w-full text-left relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${isSelected ? 'border-primary-brand bg-primary-brand/5' : !!userVotedId ? 'border-surface-high/40 bg-surface/10 opacity-70' : 'border-surface-high hover:border-white/20 bg-surface-high/20 hover:bg-surface-high/30'}`}
                    >
                      {/* Percent Fill Background anim */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary-brand/10 transition-all duration-700 ease-out z-0"
                        style={{ width: `${votePercentage}%` }}
                      />

                      <div className="relative z-10 flex justify-between items-center font-semibold text-sm">
                        <span className="text-white font-bold max-w-[80%]">{opt.title}</span>
                        <span className="text-text-muted font-bold">{votePercentage}%</span>
                      </div>

                      {/* Vote Count indicator */}
                      <div className="relative z-10 flex justify-between items-center text-[10px] text-text-muted font-bold uppercase tracking-wider mt-2">
                        <span>{t('party_poll_votes', { count: opt.votes })}</span>
                        {isSelected && <span className="text-primary-brand font-black">{t('party_voted_tag')}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Helper help text */}
              <p className="text-xs text-text-muted text-center font-semibold uppercase tracking-wider">
                {userVotedId 
                  ? t('party_already_voted_desc') 
                  : t('party_vote_cta_desc')}
              </p>
            </div>
          )}

          {/* TAB 3: DECISION WHEEL */}
          {activeTab === 'wheel' && (
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-200px)] no-scrollbar bg-surface">
              <div className="bg-surface-high/30 border border-surface-high rounded-2xl p-4 space-y-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 font-black text-[9px] uppercase tracking-widest">
                  {t('party_wheel_title')}
                </div>
                <h3 className="text-xs font-semibold text-text-main leading-relaxed">
                  {t('party_wheel_desc')}
                </h3>
              </div>

              {/* Canvas Wheel Element Container */}
              <div className="flex flex-col items-center justify-center py-4 bg-surface-high/15 border border-surface-high/30 rounded-2xl relative shadow-inner">
                <canvas 
                  ref={this.canvasRef}
                  width={240}
                  height={240}
                  className="w-[240px] h-[240px] cursor-pointer"
                  onClick={this.spinWheel}
                />
                
                {/* Spin CTA Button */}
                <button 
                  onClick={this.spinWheel}
                  disabled={isSpinning || wheelItems.length === 0}
                  className="mt-4 bg-gradient-to-r from-amber-500 to-primary-brand hover:from-amber-600 hover:to-primary-brand-hover disabled:from-surface-high disabled:to-surface-high disabled:text-text-muted text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isSpinning ? t('party_wheel_spinning') : t('party_wheel_spin_btn')}
                </button>
              </div>

              {/* Manage Entry elements */}
              <div className="space-y-4">
                <label className="block text-[10px] uppercase font-black tracking-widest text-text-muted">{t('party_wheel_items_count', { count: wheelItems.length })}</label>
                
                {/* Text Add Input field */}
                <form onSubmit={this.handleAddWheelItem} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newItemInput}
                    onChange={(e) => this.setState({ newItemInput: e.target.value })}
                    placeholder={t('party_wheel_input_placeholder')} 
                    className="flex-1 bg-surface-high border border-surface-high focus:border-amber-500/50 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none transition-colors placeholder:text-text-muted"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest px-4 rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </form>

                {/* Items collection list */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {wheelItems.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-surface-high/30 border border-surface-high/20 px-4 py-2.5 rounded-xl hover:bg-surface-high/50 transition-colors"
                    >
                      <span className="text-xs font-bold text-white truncate max-w-[190px]">{item}</span>
                      <button 
                        onClick={() => this.handleRemoveWheelItem(idx)}
                        className="text-text-muted hover:text-primary-brand transition-colors text-xs font-bold cursor-pointer px-2 py-0.5 rounded hover:bg-white/5"
                      >
                        {t('party_wheel_remove_btn')}
                      </button>
                    </div>
                  ))}
                  {wheelItems.length === 0 && (
                    <p className="text-xs text-text-muted font-medium italic text-center py-4">{t('party_wheel_empty_desc')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INVITE DETAILS */}
          {activeTab === 'invite' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="bg-surface-high/20 border border-surface-high/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs uppercase font-black tracking-widest text-text-muted">{t('party_invite_title')}</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {t('party_invite_desc')}
                </p>
              </div>

              {/* Code Copier widget */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-black tracking-widest text-text-muted">{t('party_invite_code_label')}</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-high border border-surface-high rounded-xl px-4 py-3 flex items-center justify-center text-center font-mono font-black text-lg text-white select-all">
                    {party.code}
                  </div>
                  <button 
                    onClick={this.handleCopyCode}
                    className={`px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-primary-brand hover:bg-primary-brand-hover text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]'}`}
                  >
                    {copiedCode ? t('party_copied') : t('party_copy_btn')}
                  </button>
                </div>
              </div>

              {/* Privacy Setting Indicator */}
              <div className="flex items-center gap-3 bg-surface-high/30 border border-surface-high/30 p-4 rounded-xl">
                {party.privacy === 'public' ? (
                  <>
                    <Globe className="text-emerald-500" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-white">{t('party_privacy_public_title')}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{t('party_privacy_public_desc')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="text-amber-500" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-white">{t('party_privacy_private_title')}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{t('party_privacy_private_desc')}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ==============================================
            CELEBRATIVE WHEEL WINNER POPUP MODAL OVERLAY
            ============================================== */}
        <AnimatePresence>
          {showWheelWinnerModal && wheelWinner && (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 30 }}
                className="bg-surface border border-surface-high rounded-[32px] w-full max-w-md p-8 text-center relative shadow-2xl overflow-hidden"
              >
                {/* Glowing Background Ambience */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px]" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary-brand/10 rounded-full blur-[60px]" />

                <div className="flex justify-center text-6xl mb-4 animate-bounce">
                  🎉
                </div>

                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full">
                  {t('party_wheel_modal_header')}
                </span>

                <h2 className="text-2xl md:text-3xl font-black text-white mt-6 tracking-tight leading-tight uppercase px-4 break-words">
                  {wheelWinner}
                </h2>

                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mt-4">
                  {t('party_wheel_modal_desc')}
                </p>

                <div className="mt-8 space-y-3">
                  <button 
                    onClick={() => {
                      // Attempt to search and update currently playing movie inside the watch party
                      if (activeParty) {
                        const cleanWinnerTitle = wheelWinner.replace(/[^\w\s]/g, '').trim().toLowerCase();
                        const matchedMovie = movies.find(m => 
                          m.title.toLowerCase().includes(cleanWinnerTitle) || 
                          cleanWinnerTitle.includes(m.title.toLowerCase())
                        );
                        
                        if (matchedMovie) {
                          this.setState({
                            activeParty: {
                              ...activeParty,
                              movie: matchedMovie
                            },
                            currentTime: 0,
                            isPlaying: true
                          });
                        } else {
                          // Dynamic fallback movie for custom entered movies!
                          const customMovie: Movie = {
                            id: 'custom-' + Date.now(),
                            title: wheelWinner,
                            rating: 8.8,
                            year: new Date().getFullYear(),
                            genre: t('party_wheel_title') + ' 🎡🍿',
                            poster: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop',
                            backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
                            synopsis: t('party_wheel_desc'),
                            isTrending: false
                          };
                          
                          this.setState({
                            activeParty: {
                              ...activeParty,
                              movie: customMovie
                            },
                            currentTime: 0,
                            isPlaying: true
                          });
                        }
                      }
                      this.setState({ showWheelWinnerModal: false });
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-primary-brand text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 cursor-pointer active:scale-95"
                  >
                    {t('party_wheel_set_current')}
                  </button>
                  
                  <button 
                    onClick={() => this.setState({ showWheelWinnerModal: false })}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {t('party_wheel_close')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }
}
