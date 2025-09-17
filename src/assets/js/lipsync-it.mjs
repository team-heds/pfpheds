/**
 * Classe LipsyncIt – Modulo di sincronizzazione labiale per l'italiano.
 * Ispirato a LipsyncFr, questo modulo è stato adattato alle peculiarità della fonetica italiana,
 * alla conversione dei numeri in lettere e alle combinazioni letterali tipiche della lingua italiana.
 */
class LipsyncIt {
    constructor() {
      // Mappatura fonema -> visema (codici standard Oculus OVR LipSync)
      // Ogni fonema italiano è associato a un codice visema.
      this.phonemeToViseme = {
        // Vocali
        'a': 'aa',
        'e': 'E',
        'i': 'I',
        'o': 'O',
        'u': 'U',
        // Varianti vocaliche (eventuali)
        'ɛ': 'E',
        'ɔ': 'O',
        // Consonanti
        'b': 'PP', 'm': 'PP', 'p': 'PP',      // bilabiali: b, m, p
        'f': 'FF', 'v': 'FF',                  // labiodentali: f, v
        't': 'DD', 'd': 'DD', 'l': 'DD',        // dentali/alveolari: t, d, l
        'k': 'kk',                            // velari: k
        'tʃ': 'CH',                           // affricata: tʃ (ci, ce, ch)
        'g': 'kk',                            // velare: g
        'dʒ': 'CH',                           // affricata: dʒ (ge, gi)
        'ʃ': 'CH',                            // fricativa: ʃ (da sc+e/i)
        'ʎ': 'nn',                           // laterale palatale: gli
        'ɲ': 'nn',                           // nasale palatale: gn
        'r': 'RR',                           // vibrante: r
        's': 'SS', 'z': 'SS',                  // sorda o sonora: s, z
        'kw': 'kk',                           // gruppo "qu" (/kw/)
        'w': 'U',                            // per indicare il suono di arrotondamento in "qu"
        // Silenzio o fonema sconosciuto
        'sil': 'sil',
        '?': 'sil'
      };
  
      // Lessici per la conversione dei numeri in lettere (fino a 999999)
      this.units = {
        0: "zero", 1: "uno", 2: "due", 3: "tre", 4: "quattro",
        5: "cinque", 6: "sei", 7: "sette", 8: "otto", 9: "nove",
        10: "dieci", 11: "undici", 12: "dodici", 13: "tredici",
        14: "quattordici", 15: "quindici", 16: "sedici", 17: "diciassette",
        18: "diciotto", 19: "diciannove"
      };
  
      this.tens = {
        20: "venti", 30: "trenta", 40: "quaranta",
        50: "cinquanta", 60: "sessanta", 70: "settanta",
        80: "ottanta", 90: "novanta"
      };
    }
  
    /**
     * Pre-elabora il testo in ingresso:
     *  - Converte i numeri in lettere (es. 21 -> "ventuno", 28 -> "ventotto").
     *  - Rimuove caratteri speciali e punteggiatura non necessari.
     *  - Converte il testo in minuscolo per uniformità.
     * Ritorna il testo pulito e pronto per l'analisi fonetica.
     */
    preProcessText(text) {
      if (!text) return "";
      // Sostituisce ritorni a capo e tabulazioni con uno spazio
      let cleaned = text.replace(/\s+/g, " ");
      
      // Converte le sequenze numeriche in parole
      cleaned = cleaned.replace(/\d+/g, (match) => {
        let num = parseInt(match, 10);
        return isNaN(num) ? match : this.numberToWords(num);
      });
      
      // Conversione in minuscolo (gli accenti vengono preservati)
      cleaned = cleaned.toLowerCase();
      
      // Rimuove la punteggiatura (.,!?;:/""()[])
      cleaned = cleaned.replace(/[.,!?;:/\"\(\)\[\]]/g, " ");
      
      // Rimuove eventuali spazi in eccesso all'inizio/fine
      cleaned = cleaned.trim();
      return cleaned;
    }
  
    /**
     * Converte un numero intero in lettere (fino a 999999).
     * Esempi:
     *  21 -> "ventuno" (venti senza la vocale finale + uno)
     *  28 -> "ventotto" (venti senza la vocale finale + otto)
     *  180 -> "centottanta" (attenzione all'elisione della vocale in "cento")
     */
    numberToWords(num) {
      if (num < 0) return "";
      if (num < 20) {
        return this.units[num];
      }
      if (num < 100) {
        let tens = Math.floor(num / 10) * 10;
        let ones = num % 10;
        let tensWord = this.tens[tens];
        if (ones === 0) {
          return tensWord;
        } else {
          // Se le unità sono 1 o 8, si elimina la vocale finale del tensWord
          if (ones === 1 || ones === 8) {
            tensWord = tensWord.slice(0, -1);
          }
          return tensWord + this.units[ones];
        }
      }
      if (num < 1000) {
        let hundreds = Math.floor(num / 100);
        let rest = num % 100;
        let hundredsWord = (hundreds === 1) ? "cento" : this.units[hundreds] + "cento";
        // Se il resto è compreso tra 80 e 89, "cento" perde la vocale finale
        if (rest >= 80 && rest < 90) {
          hundredsWord = hundredsWord.replace(/o$/, "");
        }
        return hundredsWord + (rest !== 0 ? this.numberToWords(rest) : "");
      }
      if (num < 1000000) {
        let thousands = Math.floor(num / 1000);
        let rest = num % 1000;
        let thousandsWord = (thousands === 1) ? "mille" : this.numberToWords(thousands) + "mila";
        return thousandsWord + (rest !== 0 ? this.numberToWords(rest) : "");
      }
      return num.toString();
    }
  
    /**
     * Converte un testo in una sequenza di visemi con relative tempistiche.
     * Restituisce un oggetto { visemes: [...], times: [...], durations: [...] }.
     *  - Applica il pre-processing del testo.
     *  - Divide il testo in parole, genera la lista di fonemi parola per parola.
     *  - Converte i fonemi in visemi e calcola i timestamp relativi.
     */
    wordsToVisemes(text) {
      let input = this.preProcessText(text);
      if (!input) {
        return { visemes: [], times: [], durations: [] };
      }
      // Divide il testo in parole
      let words = input.split(/\s+/);
      let visemes = [];
      let times = [];
      let durations = [];
      let currentTime = 0;
      
      // Elaborazione parola per parola
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (!word) continue;
        let nextWord = (i < words.length - 1) ? words[i + 1] : null;
        // Conversione della parola in lista di fonemi (senza gestione di legature o liaison)
        let phonemes = this.wordToPhonemes(word, nextWord);
        
        // Conversione dei fonemi in visemi e assegnazione delle tempistiche
        for (let ph of phonemes) {
          let viseme = this.phonemeToViseme[ph] || this.phonemeToViseme['?'];
          if (!viseme) viseme = 'sil';
          visemes.push(viseme);
          times.push(currentTime);
          // Durata: le vocali durano di più rispetto alle consonanti
          let duration = this.isVowel(ph) ? 2 : 1;
          durations.push(duration);
          currentTime += 1;
        }
      }
      // Aggiunge un visema di silenzio finale per chiudere la bocca
      visemes.push('sil');
      times.push(currentTime);
      durations.push(1);
      
      return { visemes, times, durations };
    }
  
    /**
     * Ritorna true se il fonema è una vocale.
     * Per l'italiano si considerano le vocali base: a, e, i, o, u.
     */
    isVowel(phoneme) {
      const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
      return vowels.has(phoneme);
    }
  
    /**
     * Converte una parola in una lista di fonemi.
     * Gestisce le regole fonetiche italiane, inclusi digrammi e trigrammi tipici.
     */
    wordToPhonemes(word, nextWord) {
      let phonemes = [];
      
      for (let i = 0; i < word.length; i++) {
        let c = word[i];
        
        // Ignora apostrofi, trattini e simili
        if (c === '\'' || c === '’' || c === '-') {
          continue;
        }
        
        // ==== Gestione delle combinazioni letterali ====
        
        // "gli" -> fonema /ʎ/ (es. "famiglia")
        if (c === 'g' && i <= word.length - 3 && word.substr(i, 3) === "gli") {
          phonemes.push('ʎ');
          i += 2;
          continue;
        }
        
        // "gn" -> fonema /ɲ/ (es. "lasagna")
        if (c === 'g' && i < word.length - 1 && word[i+1] === 'n') {
          phonemes.push('ɲ');
          i++;
          continue;
        }
        
        // "sc" seguito da 'e' o 'i' -> fonema /ʃ/ (es. "scena")
        if (c === 's' && i < word.length - 2 && word[i+1] === 'c' && (word[i+2] === 'e' || word[i+2] === 'i')) {
          phonemes.push('ʃ');
          i += 2;
          continue;
        }
        
        // "ch" -> fonema /k/ (es. "chiaro")
        if (c === 'c' && i < word.length - 1 && word[i+1] === 'h') {
          phonemes.push('k');
          i++;
          continue;
        }
        
        // "gh" -> fonema /g/ (es. "ghiaccio")
        if (c === 'g' && i < word.length - 1 && word[i+1] === 'h') {
          phonemes.push('g');
          i++;
          continue;
        }
        
        // "ci" -> fonema /tʃ/ (es. "ciao")
        if (c === 'c' && i < word.length - 1 && word[i+1] === 'i') {
          phonemes.push('tʃ');
          i++;
          continue;
        }
        
        // "ce" -> fonema /tʃ/ (es. "cena")
        if (c === 'c' && i < word.length - 1 && word[i+1] === 'e') {
          phonemes.push('tʃ');
          i++;
          continue;
        }
        
        // "ge" -> fonema /dʒ/ (es. "gelato")
        if (c === 'g' && i < word.length - 1 && word[i+1] === 'e') {
          phonemes.push('dʒ');
          i++;
          continue;
        }
        
        // "gi" -> fonema /dʒ/ (es. "giro")
        if (c === 'g' && i < word.length - 1 && word[i+1] === 'i') {
          phonemes.push('dʒ');
          i++;
          continue;
        }
        
        // "qu" -> rappresenta il gruppo /kw/ (es. "quattro")
        if (c === 'q' && i < word.length - 1 && word[i+1] === 'u') {
          phonemes.push('k');
          phonemes.push('w');
          i++;
          continue;
        }
        
        // ==== Gestione dei singoli caratteri ====
        
        // Vocali: converte eventuali vocali accentate nella loro forma base
        if ("aà".includes(c)) {
          phonemes.push('a');
          continue;
        }
        if ("eèé".includes(c)) {
          phonemes.push('e');
          continue;
        }
        if ("iì".includes(c)) {
          phonemes.push('i');
          continue;
        }
        if ("oòó".includes(c)) {
          phonemes.push('o');
          continue;
        }
        if ("uù".includes(c)) {
          phonemes.push('u');
          continue;
        }
        
        // Consonanti
        switch(c) {
          case 'b':
            phonemes.push('b');
            break;
          case 'c':
            // Se non è parte di una combinazione già gestita:
            if (i < word.length - 1 && (word[i+1] === 'e' || word[i+1] === 'i')) {
              phonemes.push('tʃ');
              i++;
            } else {
              phonemes.push('k');
            }
            break;
          case 'd':
            phonemes.push('d');
            break;
          case 'f':
            phonemes.push('f');
            break;
          case 'g':
            if (i < word.length - 1 && (word[i+1] === 'e' || word[i+1] === 'i')) {
              phonemes.push('dʒ');
              i++;
            } else {
              phonemes.push('g');
            }
            break;
          case 'h':
            // In italiano la "h" è muta
            break;
          case 'l':
            phonemes.push('l');
            break;
          case 'm':
            phonemes.push('m');
            break;
          case 'n':
            phonemes.push('n');
            break;
          case 'p':
            phonemes.push('p');
            break;
          case 'q':
            phonemes.push('k');
            break;
          case 'r':
            phonemes.push('r');
            break;
          case 's':
            phonemes.push('s');
            break;
          case 't':
            phonemes.push('t');
            break;
          case 'v':
            phonemes.push('v');
            break;
          case 'z':
            phonemes.push('z');
            break;
          default:
            // Carattere non riconosciuto: ignorato
            break;
        }
      }
      
      // In italiano non esiste la "liaison", quindi non si aggiungono ulteriori fonemi.
      return phonemes;
    }
  }
  
  export { LipsyncIt };
  