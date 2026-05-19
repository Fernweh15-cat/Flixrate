const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('flixrate_user_gemini_key');
    if (userKey && userKey.trim() !== '') return userKey;
  }
  try {
    return (import.meta.env.VITE_GEMINI_API_KEY) || '';
  } catch (e) {
    return '';
  }
};

const GEMINI_API_KEY = getGeminiApiKey();

// Check if Gemini API is properly configured
const isConfigured = (): boolean => {
  return typeof GEMINI_API_KEY === 'string' && 
         GEMINI_API_KEY.trim() !== '' && 
         GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
};

const getSystemInstruction = (): string => {
  const personality = typeof window !== 'undefined' ? localStorage.getItem('flixrate_ai_personality') || 'standard' : 'standard';
  const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
  
  if (lang === 'en-US') {
    const baseInstruction = `You are Cine-AI, the official virtual assistant of the Flixrate application. You are a passionate and knowledgeable cinephile expert. ALWAYS respond in English.
    
IMPORTANT RULES FOR RECOMMENDATIONS:
When recommending or mentioning real movies, ALWAYS enclose their exact titles in square brackets, for example: [Inception], [The Dark Knight] or [Gladiator].
This is CRITICAL because the application will parse your response in real-time, extract these titles, and fetch their posters and information to show them visually below your message!`;

    const personalities: Record<string, string> = {
      standard: ` Be warm, charismatic, use modern language and enrich the text with movie-themed emojis 🎬🍿🎥! Help the user discover movies, explain plots, and recommend based on genres, directors or preferences.`,
      
      critic: ` Be a true CYNICAL AND SARCASTIC FILM CRITIC! Be direct, funny, witty and extremely demanding and picky. Find flaws in plots, criticize actors in a funny and ironic way, and use cynical emojis 🧐🎬📉. Let the user know that few movies truly deserve a 10/10, but recommend masterpieces suitable only for "true cinema"!`,
      
      nerd: ` Be a SUPER NERD obsessed with movie details! Talk constantly about film formats (e.g. IMAX 70mm), production trivia, secret Easter Eggs in movies, lenses used by cinematographers (e.g. anamorphic lenses) and post-credit scenes. Use tech and nerd emojis 🤓🎥📼🖥️!`,
      
      poet: ` Be a ROMANTIC and EMOTIONAL POET of cinema! Focus on feelings, the evocative power of music, cinematography as lighting paint, and the melancholy magic of every shot. Make poetic descriptions that touch the soul and use dramatic and artistic emojis 🎭✨🎻🕯️.`
    };

    return `${baseInstruction}\n\nActive Personality Style: ${personalities[personality] || personalities.standard}`;
  } else if (lang === 'es-ES') {
    const baseInstruction = `Eres Cine-AI, el asistente virtual oficial de la aplicación Flixrate. Eres un experto cinéfilo apasionado y conocedor. Responde SIEMPRE en español.
    
REGLAS IMPORTANTES PARA LAS RECOMENDACIONES:
Cuando recomiendes o menciones películas reales, encierra SIEMPRE sus títulos exactos entre corchetes, por ejemplo: [Inception], [The Dark Knight] o [Gladiator].
¡Esto es FUNDAMENTAL porque la aplicación analizará tu respuesta en tiempo real, extraerá estos títulos y buscará sus respectivos pósteres e información real para mostrarlos gráficamente debajo de tu mensaje!`;

    const personalities: Record<string, string> = {
      standard: ` ¡Sé cálido, carismático, utiliza un lenguaje moderno y enriquece los textos con emojis de temática cinematográfica 🎬🍿🎥! Ayuda al usuario a descubrir películas, explicar tramas y recomendar según géneros, directores o preferencias.`,
      
      critic: ` ¡Sé un verdadero CRÍTICO DE CINE CÍNICO Y SARCÁSTICO! Sé directo, divertido, ingenioso y extremadamente exigente y quisquilloso. ¡Encuentra fallos en las tramas, critica a los actores de forma simpática e irónica y utiliza emojis cínicos 🧐🎬📉. Haz entender al usuario que pocas películas merecen realmente un 10/10, ¡pero recomienda obras maestras aptas solo para el "verdadero cine"!`,
      
      nerd: ` ¡Sé un SÚPER NERD obsesionado con los detalles cinematográficos! Habla constantemente sobre formatos de película (ej. IMAX 70mm), curiosidades de producción, Easter Eggs secretos en las películas, lentes utilizadas por los directores de fotografía (ej. lentes anamórficas) y escenas post-créditos. ¡Usa emojis tecnológicos y nerd 🤓🎥📼🖥️!`,
      
      poet: ` ¡Sé un POETA ROMÁNTICO y EMOCIONAL del cine! Concéntrate en los sentimientos, el poder evocativo de la música, la fotografía entendida como pintura de luz y la magia melancólica de cada plano. Haz descripciones poéticas que toquen el alma y usa emojis dramáticos y artísticos 🎭✨🎻🕯️.`
    };

    return `${baseInstruction}\n\nEstilo de Personalidad Activo: ${personalities[personality] || personalities.standard}`;
  } else {
    // Default to Italian
    const baseInstruction = `Sei Cine-AI, l'assistente virtuale ufficiale dell'applicazione Flixrate. Sei un esperto cinefilo appassionato e competente. Rispondi SEMPRE in italiano.
    
REGOLE IMPORTANTI PER LE RACCOMANDAZIONI:
Quando consigli o citi dei film reali, racchiudi SEMPRE i loro titoli esatti all'interno di parentesi quadre, ad esempio: [Inception], [Il cavaliere oscuro] o [Il Gladiatore]. 
Questo è FONDAMENTALE perché l'applicazione analizzerà la tua risposta in tempo reale, estrarrà questi titoli e cercherà i rispettivi poster ed informazioni reali per mostrarli graficamente sotto il tuo messaggio!`;

    const personalities: Record<string, string> = {
      standard: ` Sii caloroso, carismatico, usa un linguaggio moderno e arricchisci i testi con emoji a tema cinematografico 🎬🍿🎥! Aiuta l'utente a scoprire film, spiegare trame e consigliare in base a generi, registi o preferenze.`,
      
      critic: ` Sii un vero CRITICO CINEMATOGRAFICO CINICO E SARCASTICO! Sii diretto, divertente, arguto ed estremamente esigente e pignolo. Trova difetti nelle trame, critica gli attori in modo simpatico ed ironico, ed usa emoji ciniche 🧐🎬📉. Fai capire all'utente che pochi film meritano davvero un 10/10, ma consiglia capolavori adatti solo al "vero cinema"!`,
      
      nerd: ` Sii un SUPER NERD maniaco dei dettagli cinematografici! Parla costantemente di formati di pellicola (es. IMAX 70mm), curiosità di produzione, Easter Eggs segreti nei film, lenti usate dai direttori della fotografia (es. lenti anamorfiche) e scene post-credit. Usa emoji tech e nerd 🤓🎥📼🖥️!`,
      
      poet: ` Sii un POETA ROMANTICO ed EMOZIONALE del cinema! Concentrati sui sentimenti, sul potere evocativo della musica, sulla fotografia intesa come pittura di luce e sulla magia malinconica di ogni inquadratura. Fai descrizioni poetiche che toccano l'anima e usa emoji drammatiche ed artistiche 🎭✨🎻🕯️.`
    };

    return `${baseInstruction}\n\nStile di Personalità Attivo: ${personalities[personality] || personalities.standard}`;
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Creative offline mock responder when GEMINI_API_KEY is not configured
const getMockAIResponse = (message: string): string => {
  const msg = message.toLowerCase();
  const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';

  if (lang === 'en-US') {
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('ciao')) {
      return `Hello cinephile! 🎬🍿 I am Cine-AI, the Flixrate virtual assistant! Right now I am running in **offline demo mode** (no API key configured), but I still know a lot about cinema! 

How can I help you today? Ask me for recommendations on [Sci-Fi] or [Action] movies, or tell me what you like!`;
    }
    
    if (msg.includes('fantascienza') || msg.includes('science fiction') || msg.includes('sci-fi') || msg.includes('space') || msg.includes('future')) {
      return `Science fiction is pure visual poetry! 🚀 I highly recommend two must-watch masterpieces:
      
1. **[Interstellar]** (2014): To travel beyond the boundaries of space and time with a soundtrack that gives you chills.
2. **[Matrix]** (1999): The movie that redefined the action-scifi genre and our perception of reality.
3. **[The Eclipse Protocol]** (2024): Our sci-fi flagship!

Which of these appeals to you the most? 🌌`;
    }

    if (msg.includes('azione') || msg.includes('action') || msg.includes('fight') || msg.includes('shoot') || msg.includes('thrill')) {
      return `Pure adrenaline! 💥 If you're looking for movies to keep you on the edge of your seat, here are my picks:
      
- **[The Dark Knight]** (2008): Probably the best superhero movie ever made, featuring a legendary Joker.
- **[Gladiator]** (2000): Strength and honor! A memorable historical epic of revenge and courage.
- **[Shadow Strike]** (2024): If you want pure action with spectacular choreography.

Are you in the mood for a historical story or a modern thriller? ⚔️`;
    }

    if (msg.includes('consigli') || msg.includes('recommend') || msg.includes('suggest') || msg.includes('good movie')) {
      return `Certainly! Here are three extraordinary movies of completely different genres that everyone should watch at least once in their life:
      
* 🎭 **[The Godfather]**: A milestone in cinema history. Perfect directing and acting.
* 🚢 **[Titanic]**: An epic story of love, drama and spectacular visuals.
* 🕸️ **[Spider-Man: Into the Spider-Verse]**: A fresh, dynamic and exciting masterpiece of animation.

Is there a specific genre you prefer right now? 🎬`;
    }

    if (msg.includes('grazie') || msg.includes('thanks') || msg.includes('thank you') || msg.includes('perfect') || msg.includes('ok')) {
      return `You're welcome! It's always a pleasure to talk about movies. 🍿 If you have any other questions about plots, actors or want more recommendations, I'm here for you. Enjoy your viewing on Flixrate! 🎞️`;
    }

    return `What a great thought! 🎬 Since I am in **offline demo mode**, I cannot access my entire artificial brain, but if you like that kind of atmosphere, I highly recommend exploring iconic films like **[Inception]** (for mind-bending journeys) or **[The Godfather]** (for masterful storytelling).

Do you want to know more about one of these titles or do you prefer to explore a genre like **[Action]** or **[Sci-Fi]**? 🎥🍿`;

  } else if (lang === 'es-ES') {
    if (msg.includes('hola') || msg.includes('buenos dias') || msg.includes('saludos') || msg.includes('ciao')) {
      return `¡Hola cinéfilo! 🎬🍿 Soy Cine-AI, ¡el asistente virtual de Flixrate! En este momento estoy funcionando en **modo de demostración fuera de línea** (sin clave API configurada), ¡pero todavía sé mucho sobre cine! 

¿Cómo puedo ayudarte hoy? ¡Pídeme recomendaciones sobre películas de [Ciencia Ficción], [Acción], o dime qué te gusta!`;
    }
    
    if (msg.includes('fantascienza') || msg.includes('ciencia ficción') || msg.includes('sci-fi') || msg.includes('espacio') || msg.includes('futuro')) {
      return `¡La ciencia ficción es pura poesía visual! 🚀 Te recomiendo encarecidamente dos obras maestras imperdibles:
      
1. **[Interstellar]** (2014): Para viajar más allá de los confines del tiempo y el espacio con una banda sonora que pone la piel de gallina.
2. **[Matrix]** (1999): La película que redefinió el género de acción y ciencia ficción y nuestra percepción de la realidad.
3. **[The Eclipse Protocol]** (2024): ¡Nuestra joya de la ciencia ficción!

¿Cuál de estos te atrae más? 🌌`;
    }

    if (msg.includes('azione') || msg.includes('acción') || msg.includes('action') || msg.includes('pelea') || msg.includes('disparos')) {
      return `¡Adrenalina pura! 💥 Si buscas películas que te mantengan pegado al asiento, aquí tienes mis elecciones:
      
- **[The Dark Knight]** (2008): Probablemente la mejor película de superhéroes jamás realizada, con un Joker legendario.
- **[Gladiator]** (2000): ¡Fuerza y honor! Una epopeya histórica memorable de venganza y coraje.
- **[Shadow Strike]** (2024): Si buscas acción pura con coreografías espectaculares.

¿Te apetece una historia histórica o un thriller moderno? ⚔️`;
    }

    if (msg.includes('consigli') || msg.includes('recomiendas') || msg.includes('sugieres') || msg.includes('película bella') || msg.includes('consejos')) {
      return `¡Por supuesto! Aquí tienes tres películas extraordinarias de géneros completamente diferentes que todos deberían ver al menos una vez en la vida:
      
* 🎭 **[The Godfather]**: Un hito en la historia del cine. Dirección y actuación perfectas.
* 🚢 **[Titanic]**: Una historia de amor épica dramática y visualmente espectacular.
* 🕸️ **[Spider-Man: Into the Spider-Verse]**: Una obra maestra de animación fresca, dinámica y emocionante.

¿Hay algún género específico que prefieras en este momento? 🎬`;
    }

    if (msg.includes('grazie') || msg.includes('gracias') || msg.includes('perfecto') || msg.includes('ok')) {
      return `¡De nada! Siempre es un placer hablar de cine. 🍿 Si tienes más preguntas sobre tramas, actores o quieres más consejos, aquí estoy para ayudarte. ¡Disfruta de tu reproducción en Flixrate! 🎞️`;
    }

    return `¡Qué excelente reflexión! 🎬 Como estoy en **modo de demostración fuera de línea**, no puedo acceder a todo mi cerebro artificial, pero si te interesa ese tipo de atmósfera, te recomiendo encarecidamente explorar películas icónicas como **[Inception]** (para viajes mentales) o **[The Godfather]** (para una narración magistral).

¿Quieres saber más sobre uno de estos títulos o prefieres explorar un género como **[Acción]** o **[Ciencia Ficción]**? 🎥🍿`;

  } else {
    // Default to Italian
    if (msg.includes('ciao') || msg.includes('salve') || msg.includes('buongiorno')) {
      return `Ciao cinefilo! 🎬🍿 Sono Cine-AI, l'assistente virtuale di Flixrate! Al momento sto funzionando in **modalità offline dimostrativa** (nessuna chiave API configurata), ma conosco comunque un sacco di cinema! 
  
Come posso aiutarti oggi? Chiedimi dei consigli su film di [Fantascienza], [Azione], o dimmi cosa ti piace!`;
    }
    
    if (msg.includes('fantascienza') || msg.includes('sci-fi') || msg.includes('spazio') || msg.includes('futuro')) {
      return `La fantascienza è pura poesia visiva! 🚀 Ti consiglio caldamente due capolavori imperdibili:
      
1. **[Interstellar]** (2014): Per viaggiare oltre i confini del tempo e dello spazio con una colonna sonora da brividi.
2. **[Matrix]** (1999): Il film che ha ridefinito il genere action-scifi e la nostra percezione della realtà.
3. **[The Eclipse Protocol]** (2024): La nostra punta di diamante fantascientifica!
  
Quale di questi ti attira di più? 🌌`;
    }
  
    if (msg.includes('azione') || msg.includes('action') || msg.includes('combatt') || msg.includes('spari')) {
      return `Adrenalina pura! 💥 Se cerchi film che ti tengano incollato alla sedia, ecco le mie scelte:
      
- **[Il cavaliere oscuro]** (2008): Probabilmente il miglior film di supereroi mai realizzato, con un Joker leggendario.
- **[Il Gladiatore]** (2000): Forza e onore! Un'epopea storica di vendetta e coraggio memorabile.
- **[Shadow Strike]** (2024): Se cerchi azione allo stato puro con coreografie spettacolari.
  
Ti va una storia storica o un thriller moderno? ⚔️`;
    }
  
    if (msg.includes('consigli') || msg.includes('consigliami') || msg.includes('suggerisci') || msg.includes('bello')) {
      return `Certamente! Ecco tre film straordinari di generi completamente diversi che chiunque dovrebbe vedere almeno una volta nella vita:
      
* 🎭 **[Il Padrino]**: Pietra miliare della storia del cinema. Una regia e recitazione perfette.
* 🚢 **[Titanic]**: Un'epica storia d'amore drammatica e visivamente spettacolare.
* 🕸️ **[Spider-Man: Un nuovo universo]**: Un capolavoro di animazione fresco, dinamico ed emozionante.
  
C'è un genere specifico che preferisci in questo momento? 🎬`;
    }
  
    if (msg.includes('grazie') || msg.includes('perfetto') || msg.includes('ok')) {
      return `Figurati! È sempre un piacere parlare di cinema. 🍿 Se hai altre domande su trame, attori o vuoi altri consigli, sono qui per te. Buona visione su Flixrate! 🎞️`;
    }
  
    return `Che ottima riflessione! 🎬 Essendo in **modalità offline dimostrativa**, non posso accedere a tutto il mio cervello artificiale, ma se ti interessa quel tipo di atmosfera, ti consiglio vivamente di esplorare film iconici come **[Inception]** (per i viaggi nella mente) o **[Il Padrino]** (per una narrazione magistrale).
  
Vuoi saperne di più su uno di questi titoli o preferisci esplorare un genere come l'**[Azione]** o la **[Fantascienza]**? 🎥🍿`;
  }
};

// Send message to Gemini API
export const sendGeminiMessage = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  if (!isConfigured()) {
    console.log('Gemini API Key missing, returning simulated offline response.');
    // Add small delay to simulate processing network request
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockAIResponse(message);
  }

  try {
    const formattedContents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: getSystemInstruction() }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Malformed API response');
  } catch (error) {
    console.error('Error contacting Gemini API, falling back to mock:', error);
    return getMockAIResponse(message);
  }
};
