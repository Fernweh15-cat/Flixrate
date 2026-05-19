import React, { Component, createRef } from 'react';
import { Send, Sparkles, Film, ArrowRight, User, RefreshCw, MessageSquare } from 'lucide-react';
import { getSafeWatchlist, getSafeWatched } from '../lib/tmdb';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface FlixAIState {
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  error: string | null;
}

export default class FlixAI extends Component<{}, FlixAIState> {
  private chatEndRef = createRef<HTMLDivElement>();

  constructor(props: {}) {
    super(props);
    this.state = {
      messages: [],
      inputText: '',
      isLoading: false,
      error: null
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.initWelcomeMessage();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  initWelcomeMessage = () => {
    const watchlist = getSafeWatchlist();
    const watched = getSafeWatched();

    let welcomeText = t('flixai_welcome_base');

    if (watchlist.length > 0 || watched.length > 0) {
      welcomeText += t('flixai_welcome_analyzing');
      if (watchlist.length > 0) {
        welcomeText += t('flixai_welcome_watchlist', { count: watchlist.length, first: watchlist[0].title });
      }
      if (watched.length > 0) {
        welcomeText += t('flixai_welcome_watched', { count: watched.length, first: watched[0].title });
      }
      welcomeText += t('flixai_welcome_prompt');
    } else {
      welcomeText += t('flixai_welcome_empty');
    }

    this.setState({
      messages: [
        {
          id: 'welcome',
          role: 'model',
          content: welcomeText,
          timestamp: new Date()
        }
      ]
    });
  };

  handleSend = async (textToSend?: string) => {
    const text = (textToSend || this.state.inputText).trim();
    if (!text) return;

    // Create user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    this.setState((prevState) => ({
      messages: [...prevState.messages, userMsg],
      inputText: '',
      isLoading: true,
      error: null
    }));

    try {
      // Gather context
      const watchlist = getSafeWatchlist().map(m => `${m.title} (${m.genre})`).join(', ');
      const watched = getSafeWatched().map(m => `${m.title} (${m.genre})`).join(', ');
      
      const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
      let userContext = '';
      if (lang === 'en-US') {
        userContext = `\n- User's Watchlist to watch: [${watchlist || 'None'}]\n- Movies marked as watched by the user: [${watched || 'None'}]\n`;
      } else if (lang === 'es-ES') {
        userContext = `\n- Watchlist del usuario para ver: [${watchlist || 'Ninguno'}]\n- Películas que el usuario ha marcado como vistas: [${watched || 'Ninguno'}]\n`;
      } else {
        userContext = `\n- Watchlist dell'utente da vedere: [${watchlist || 'Nessuno'}]\n- Film che l'utente ha segnato come visti: [${watched || 'Nessuno'}]\n`;
      }

      // Call API
      const apiMessages = [...this.state.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const reply = await this.callGemini(apiMessages, userContext);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date()
      };

      this.setState((prevState) => ({
        messages: [...prevState.messages, aiMsg],
        isLoading: false
      }));
    } catch (err: any) {
      this.setState({
        error: err.message || t('flixai_error_connection'),
        isLoading: false
      });
    }
  };

  callGemini = async (messages: { role: 'user' | 'model'; content: string }[], userContext: string): Promise<string> => {
    const getApiKey = (): string => {
      const userKey = typeof window !== 'undefined' ? localStorage.getItem('flixrate_user_gemini_key') : null;
      if (userKey && userKey.trim() !== '') return userKey;
      return import.meta.env.VITE_GEMINI_API_KEY || '';
    };

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(t('flixai_error_key'));
    }

    const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
    let systemInstruction = '';

    if (lang === 'en-US') {
      systemInstruction = `You are CineAI, an expert and passionate movie assistant. You speak strictly in English.
Your goal is to recommend movies, discuss plots, explain directing details, trivia, and reviews in a warm, informed, and professional way.
Use movie emojis (🎬, 🍿, 🎭, ⭐️, etc.) appropriately and naturally.
Use rich and clean markdown formatting: bulleted lists for suggestions, movie titles in bold (e.g. **Gladiator**).
Here is the real user data from Flixrate to personalize movie recommendations:
${userContext}
Refer to these movies if the user asks for recommendations based on their watchlist or history, otherwise recommend great masterpieces or TMDB hits freely.`;
    } else if (lang === 'es-ES') {
      systemInstruction = `Eres CineAI, un asistente de cine experto y apasionado. Hablas estrictamente en español.
Tu objetivo es recomendar películas, discutir tramas, explicar detalles de dirección, curiosidades y críticas de forma cálida, informada y profesional.
Usa emojis cinematográficos (🎬, 🍿, 🎭, ⭐️, etc.) de forma adecuada y natural.
Usa un formato markdown rico y limpio: listas con viñetas para sugerencias, títulos de películas en negrita (ej. **Gladiator**).
Aquí están los datos reales del usuario de Flixrate para personalizar las recomendaciones de películas:
${userContext}
Haz referencia a estas películas si el usuario pide recomendaciones basadas en su watchlist o historial; de lo contrario, recomienda libremente grandes obras maestras o éxitos de TMDB.`;
    } else {
      systemInstruction = `Sei CineAI, un assistente cinematografico esperto ed appassionato. Parli rigorosamente in italiano.
Il tuo obiettivo è consigliare film, discutere trame, spiegare dettagli di regia, curiosità e recensioni in modo caloroso, informato e professionale.
Usa emoji cinematografiche (🎬, 🍿, 🎭, ⭐️, etc.) in modo appropriato e naturale.
Usa una formattazione markdown ricca e pulita: elenchi puntati per i suggerimenti, titoli di film in grassetto (es: **Il Gladiatore**).
Ecco i dati reali dell'utente Flixrate per personalizzare i consigli cinematografici:
${userContext}
Fai riferimento a questi film se l'utente chiede consigli basati sulla sua watchlist o cronologia, altrimenti consiglia liberamente grandi capolavori o successi TMDB.`;
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error response:', errorText);
      throw new Error(t('flixai_error_communication'));
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(t('flixai_error_malformed'));
    }
    return text;
  };

  renderMarkdown = (text: string) => {
    // Simple markdown formatting helper
    return text.split('\n').map((line, index) => {
      let content = line;
      // Bold rendering: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderedText = parts.length > 0 ? parts : content;

      // Unordered lists rendering
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const listContent = line.trim().substring(2);
        // re-render bold inside list
        const listParts = [];
        let listLastIndex = 0;
        let listMatch;
        while ((listMatch = boldRegex.exec(listContent)) !== null) {
          if (listMatch.index > listLastIndex) {
            listParts.push(listContent.substring(listLastIndex, listMatch.index));
          }
          listParts.push(<strong key={listMatch.index} className="text-white font-extrabold">{listMatch[1]}</strong>);
          listLastIndex = boldRegex.lastIndex;
        }
        if (listLastIndex < listContent.length) {
          listParts.push(listContent.substring(listLastIndex));
        }
        return (
          <li key={index} className="ml-4 list-disc text-text-main/90 mb-1 pl-1">
            {listParts.length > 0 ? listParts : listContent}
          </li>
        );
      }

      return (
        <p key={index} className="text-text-main/90 leading-relaxed mb-3">
          {renderedText}
        </p>
      );
    });
  };

  render() {
    const { messages, inputText, isLoading, error } = this.state;
    const watchlist = getSafeWatchlist();
    const watched = getSafeWatched();

    const suggestions = [
      t('flixai_suggestion_1'),
      t('flixai_suggestion_2'),
      t('flixai_suggestion_3'),
      t('flixai_suggestion_4')
    ];

    return (
      <div className="pb-32 pt-20 max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-60px)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-high pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-brand/10 border border-primary-brand/30 rounded-2xl flex items-center justify-center text-primary-brand shadow-lg">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-2">
                CineAI Assistant
              </h2>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                {t('flixai_status_online')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (window.confirm(t('flixai_reset_confirm'))) {
                this.initWelcomeMessage();
              }
            }}
            className="p-2 rounded-xl bg-surface hover:bg-surface-high border border-surface-high text-text-muted hover:text-white transition-colors"
            title={t('flixai_reset_title')}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          {/* Main Chat Column */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Chat area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4 mb-4">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border font-bold text-xs ${
                    m.role === 'user' 
                      ? 'bg-primary-brand border-primary-brand/30 text-white' 
                      : 'bg-surface border-surface-high text-primary-brand'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>

                  {/* Message bubble */}
                  <div className={`p-4 rounded-3xl ${
                    m.role === 'user' 
                      ? 'bg-primary-brand text-white rounded-tr-none shadow-lg' 
                      : 'bg-surface border border-surface-high text-text-main rounded-tl-none'
                  }`}>
                    <div className="text-sm">
                      {this.renderMarkdown(m.content)}
                    </div>
                    <span className="text-[9px] opacity-40 block text-right mt-1 font-bold">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-surface border border-surface-high text-primary-brand">
                    <Sparkles size={14} className="animate-spin" />
                  </div>
                  <div className="bg-surface border border-surface-high p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-2xl text-xs font-bold flex flex-col gap-1">
                  <p>⚠️ {error}</p>
                  <p className="opacity-75 font-normal">{t('flixai_error_hint')}</p>
                </div>
              )}

              <div ref={this.chatEndRef} />
            </div>

            {/* Suggestion pills (only if chat has just started) */}
            {messages.length === 1 && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => this.handleSend(s.substring(2))} // strip emoji
                    className="text-left p-3.5 bg-surface hover:bg-surface-high border border-surface-high hover:border-primary-brand/30 rounded-2xl text-xs font-bold text-text-main/90 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{s}</span>
                    <ArrowRight size={14} className="text-primary-brand opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* Input box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                this.handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => this.setState({ inputText: e.target.value })}
                placeholder={t('flixai_placeholder')}
                disabled={isLoading}
                className="w-full bg-surface border border-surface-high focus:border-primary-brand/50 rounded-2xl px-6 py-4 pr-16 text-sm font-medium text-white placeholder-text-muted focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="absolute right-3 p-2.5 rounded-xl bg-primary-brand text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Right Sidebar: Sync Status */}
          <div className="hidden lg:flex w-72 shrink-0 bg-surface border border-surface-high rounded-3xl p-6 flex-col gap-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('flixai_synced_data')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('flixai_synced_desc')}
              </p>
            </div>

            {/* Watchlist Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-high pb-2">
                <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">{t('flixai_watchlist_title')}</span>
                <span className="text-xs font-black text-primary-brand bg-primary-brand/10 px-2 py-0.5 rounded-md">{watchlist.length}</span>
              </div>
              {watchlist.length > 0 ? (
                <div className="space-y-2">
                  {watchlist.slice(0, 3).map((m: any) => (
                    <div key={m.id} className="flex gap-2.5 items-center p-2 rounded-xl bg-background/50 border border-surface-high/50">
                      <img src={m.poster} className="w-8 aspect-[2/3] object-cover rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{m.title}</p>
                        <p className="text-[10px] text-text-muted truncate">{m.genre}</p>
                      </div>
                    </div>
                  ))}
                  {watchlist.length > 3 && (
                    <p className="text-[10px] text-text-muted font-bold italic text-center">{t('flixai_more_movies', { count: watchlist.length - 3 })}</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-text-muted italic bg-background/30 p-3 rounded-xl border border-surface-high/30 text-center">{t('flixai_empty_watchlist')}</p>
              )}
            </div>

            {/* Watched Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-high pb-2">
                <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">{t('flixai_watched_title')}</span>
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{watched.length}</span>
              </div>
              {watched.length > 0 ? (
                <div className="space-y-2">
                  {watched.slice(0, 3).map((m: any) => (
                    <div key={m.id} className="flex gap-2.5 items-center p-2 rounded-xl bg-background/50 border border-surface-high/50">
                      <img src={m.poster} className="w-8 aspect-[2/3] object-cover rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{m.title}</p>
                        <p className="text-[10px] text-text-muted truncate">{m.genre}</p>
                      </div>
                    </div>
                  ))}
                  {watched.length > 3 && (
                    <p className="text-[10px] text-text-muted font-bold italic text-center">{t('flixai_more_movies', { count: watched.length - 3 })}</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-text-muted italic bg-background/30 p-3 rounded-xl border border-surface-high/30 text-center">{t('flixai_empty_watched')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
