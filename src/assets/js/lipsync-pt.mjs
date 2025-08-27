/**
 * Classe LipsyncFrCh – Module de synchronisation labiale pour le français (Suisse).
 * Inspiré de LipsyncEn, adapté aux spécificités du français suisse (septante, huitante, nonante, accents, liaisons, h aspiré).
 */

 
   export default class LipsyncPt {
       /** Correspondance des phonèmes du portugais vers les visèmes OVR LipSync */
       private phonemeToViseme: { [phoneme: string]: string } = {
           // Voyelles (orales et nasales) -> visèmes voyelles
           "a":  "aa",   // son [a] ouvert (ex: "pai") → bouche grande ouverte
           "ã":  "aa",   // [ɐ̃] nasal (ex: "mã") → visème similaire à [a]
           "e":  "E",    // [e] fermé ou [ɛ] ouvert (ex: "vê", "pé") → visème "E"
           "ẽ":  "E",    // [ẽ] nasal → même position de bouche que /e/
           "i":  "ih",   // [i] (ex: "vi") → visème "ih" (sourire étiré)
           "ĩ":  "ih",   // [ĩ] nasal → visème "ih"
           "o":  "oh",   // [o] fermé ou [ɔ] ouvert (ex: "avô", "só") → visème "oh"
           "õ":  "oh",   // [õ] nasal → même visème que /o/
           "u":  "ou",   // [u] (ex: "tu") → lèvres très arrondies ("ou")
           "ũ":  "ou",   // [ũ] nasal → visème "ou"
           "w":  "ou",   // semi-voyelle [w] (ex: "quase" [kw]) → forme proche de "ou"
           "j":  "ih",   // semi-voyelle [j] (ex: "mãe" [mɐ̃j]) → similaire à un /i/ bref
   
           // Consonnes -> visèmes consonnes
           // Occlusion bilabiale (p, b, m) → visème "PP" (bouche fermée)
           "p":  "PP", "b": "PP", "m": "PP",
           // Labio-dental (f, v) → visème "FF" (lèvre sous dents)
           "f":  "FF", "v": "FF",
           // Dental (t, d) → visème "DD" (langue derrière dents, bouche modérément ouverte)
           "t":  "DD", "d": "DD",
           // Occlusive vélaire (k, g) → visème "kk" (bouche ouverte moyenne, son fond de gorge)
           "k":  "kk", "g": "kk",
           // Constrictives dentaires (s, z) et alvéo-palatales (ch, j) 
           // → on utilise "SS" pour [s] ou [z], et "CH" pour les sons [ʃ], [ʒ], [tʃ], [dʒ]
           "s":  "SS", "z":  "SS",
           "ʃ":  "CH", "ʒ":  "CH",   // (on utilisera 'ch' et 'j' dans le code pour ces sons)
           "tʃ": "CH", "dʒ": "CH",
           // Nasales (n, nh) et latérale (l, lh) → visème "nn" (langue sur le palais, bouche légèrement ouverte)
           "n":  "nn", "ɲ": "nn",   // 'nh' -> [ɲ]
           "l":  "nn", "ʎ": "nn",   // 'lh' -> [ʎ]
           // Constrictive rhotique (r) → visème "RR" (position de son [r/ʁ], gorge ou langue vibrante)
           "ɾ": "RR", "ʁ": "RR"    // on utilisera 'r' (flap) et 'R' (fort) pour distinction interne
       };
   
       /**
        * Pré-traite le texte d'entrée:
        *  - met en minuscules,
        *  - remplace les chiffres par leur écriture en toutes lettres,
        *  - enlève les signes de ponctuation non pertinents pour la phonétique.
        * @param text Le texte brut (peut contenir des chiffres, etc.)
        * @return Texte normalisé prêt pour conversion phonétique.
        */
       public preProcessText(text: string): string {
           // Mise en minuscules
           let result = text.toLowerCase();
           // Conversion des nombres en toutes lettres (entiers uniquement)
           // On remplace chaque nombre isolé (suite de chiffres) par sa transcription en lettres.
           result = result.replace(/\d+/g, match => this.numberToWords(parseInt(match, 10)));
           // Suppression de la ponctuation (garde les apostrophes/hyphens s'ils peuvent lier des mots)
           result = result.replace(/[.,;:!?\"()«»\-–—]/g, ' ');
           // Suppression des doubles espaces éventuellement créés
           result = result.replace(/\s+/g, ' ').trim();
           return result;
       }
   
       /**
        * Convertit un nombre entier (en chiffres) en toutes lettres (en portugais brésilien).
        * @param num L'entier à convertir (0 <= num < 1e15 environ pris en charge).
        * @return Le nombre exprimé en toutes lettres en PT-BR.
        */
       public numberToWords(num: number): string {
           if (num === 0) return "zero";
           let words: string = "";
   
           // Dictionnaires de base
           const units: { [key: number]: string } = {
               0: "zero", 1: "um", 2: "dois", 3: "três", 4: "quatro",
               5: "cinco", 6: "seis", 7: "sete", 8: "oito", 9: "nove"
           };
           const teens: { [key: number]: string } = {
               10: "dez", 11: "onze", 12: "doze", 13: "treze",
               14: "quatorze", 15: "quinze", 16: "dezesseis",
               17: "dezessete", 18: "dezoito", 19: "dezenove"
           };
           const tens: { [key: number]: string } = {
               10: "dez", 20: "vinte", 30: "trinta", 40: "quarenta",
               50: "cinquenta", 60: "sessenta", 70: "setenta",
               80: "oitenta", 90: "noventa"
           };
           const hundreds: { [key: number]: string } = {
               100: "cem", 200: "duzentos", 300: "trezentos", 400: "quatrocentos",
               500: "quinhentos", 600: "seiscentos", 700: "setecentos",
               800: "oitocentos", 900: "novecentos"
           };
   
           // Fonctions auxiliaires pour les blocs <1000
           const twoDigitsToWords = (n: number): string => {
               if (n < 10) {
                   return units[n];
               } else if (n < 20) {
                   return teens[n];
               } else {
                   const ten = Math.floor(n / 10) * 10; // dizaine (10,20,...)
                   const unit = n % 10;
                   if (unit === 0) {
                       return tens[ten];
                   } else {
                       // ex: 21 -> "vinte e um"
                       return `${tens[ten]} e ${units[unit]}`;
                   }
               }
           };
   
           const threeDigitsToWords = (n: number): string => {
               if (n < 100) {
                   return twoDigitsToWords(n);
               }
               if (n in hundreds) {
                   // Nombre pile (100, 200, ..., 900)
                   if (n === 100) return "cem"; // 100 a une forme irrégulière
                   return hundreds[n];
               }
               // Nombres entre x01 et x99
               const hundred = Math.floor(n / 100) * 100; // partie centaine (ex:  hundreds = 500 pour 518)
               const rest = n % 100;
               //  cento e ...  (101-199 utilisent "cento" au lieu de "cem")
               const hundredWord = (hundred === 100 ? "cento" : hundreds[hundred] || "");
               return `${hundredWord} e ${twoDigitsToWords(rest)}`;
           };
   
           // Gestion des échelles (mil, milhão, bilhão, etc.)
           const scaleNames: { value: number, singular: string, plural: string }[] = [
               { value: 1e12, singular: "trilhão", plural: "trilhões" },
               { value: 1e9,  singular: "bilhão",  plural: "bilhões"  },
               { value: 1e6,  singular: "milhão",  plural: "milhões"  },
               { value: 1000, singular: "mil",    plural: "mil"      }
           ];
           // On va traiter de la plus grande échelle à la plus petite
           let remaining = num;
           for (const scale of scaleNames) {
               if (remaining >= scale.value) {
                   const scaleCount = Math.floor(remaining / scale.value);  // nombre de X (millions, etc.)
                   remaining %= scale.value;
                   let scaleWords = "";
                   if (scale.value === 1000) {
                       // Cas des milliers (singular/plural "mil" est invariable en portugais pour l'usage cardinal)
                       if (scaleCount === 1) {
                           scaleWords = "mil";
                       } else {
                           // Attention: pour 2000, 3000, ... on utilise "dois mil", "três mil", etc.
                           // (on utilise le masculin par défaut)
                           scaleWords = this.numberToWords(scaleCount) + " mil";
                       }
                   } else {
                       // Cas des million, milliard, billion... 
                       scaleWords = (scaleCount === 1)
                           ? `um ${scale.singular}`
                           : `${this.numberToWords(scaleCount)} ${scale.plural}`;
                   }
                   if (words.length > 0) {
                       // Règle d'insertion de "e":
                       // On ajoute " e " si la partie restante est < 100 (ex: 1.001 -> "um milhão e um"),
                       // sinon on ajoute simplement un espace (ex: 1.200.000 -> "um milhão duzentos mil").
                       words += (remaining < 100 ? " e " : " ");
                   }
                   words += scaleWords;
               }
           }
           // Traiter la fin (< 1000)
           if (remaining > 0) {
               if (words.length > 0) {
                   // Entre la partie supérieure et la partie <1000, appliquer la même règle de "e"
                   words += (remaining < 100 ? " e " : " ");
               }
               words += threeDigitsToWords(remaining);
           }
           return words;
       }
   
       /**
        * Convertit un mot portugais en une liste de phonèmes (représentés par des chaînes).
        * Applique des règles phonétiques pour l'accent brésilien de São Paulo.
        * @param word Mot en portugais (en minuscules, sans ponctuation).
        * @return Tableau de phonèmes représentant la prononciation.
        */
       public wordToPhonemes(word: string): string[] {
           const phonemes: string[] = [];
           const vowels = "aeiouáéíóúâêôãõ";  // voyelles (avec accents/diacritiques possibles)
           const isVowel = (ch: string) => vowels.indexOf(ch) !== -1;
   
           let i = 0;
           while (i < word.length) {
               const ch = word[i];
   
               // Ignorer les espaces éventuellement (mots composites déjà séparés normalement)
               if (ch === ' ' || ch === '\u00A0') { // espace normal ou insécable
                   i++;
                   continue;
               }
   
               // 1. Digrammes/trigrammes spéciaux (nh, lh, ch, rr, ss, gu, qu, ão, ãe, õe, etc.)
               const next = (i < word.length - 1) ? word[i+1] : '';
               const prev = (i > 0) ? word[i-1] : '';
   
               // 'nh' -> [ɲ] (gn nasal palatal)
               if (ch === 'n' && next === 'h') {
                   phonemes.push('ɲ');
                   i += 2;
                   continue;
               }
               // 'lh' -> [ʎ] (l mouillé palatal)
               if (ch === 'l' && next === 'h') {
                   phonemes.push('ʎ');
                   i += 2;
                   continue;
               }
               // 'ch' -> [ʃ] (son "ch" chuinté)
               if (ch === 'c' && next === 'h') {
                   phonemes.push('ʃ');
                   i += 2;
                   continue;
               }
               // 'rr' -> son r fort (guttural) [ʁ] en début ou intérieur (on le note 'R' pour mapping)
               if (ch === 'r' && next === 'r') {
                   phonemes.push('ʁ');
                   i += 2;
                   continue;
               }
               // 'ss' -> simple [s] non voisé, évite la sonorisation entre voyelles
               if (ch === 's' && next === 's') {
                   phonemes.push('s');
                   i += 2;
                   continue;
               }
               // 'gu' + e/i -> le 'u' n'est pas prononcé (ex: "guerra" -> [ɡɛʁa], "guiar" -> [ɡiaʁ])
               if (ch === 'g' && next === 'u') {
                   const next2 = (i < word.length - 2) ? word[i+2] : '';
                   if (next2 === 'e' || next2 === 'é' || next2 === 'ê' || next2 === 'i' || next2 === 'í') {
                       // 'gue'/'gui' => [ge]/[gi] (u muet)
                       phonemes.push('g');
                       i += 2; // on saute le 'u'
                       continue;
                   }
                   // sinon, 'gu' devant 'a', 'o' -> le 'u' se prononce [w] (ex: "linguiça" -> [lĩˈɡwisa])
                   // On traite ce cas plus bas lors de la voyelle si nécessaire.
               }
               // 'qu' + e/i -> 'u' muet (ex: "quem" -> [kẽj], "quilo" -> [ˈkilu])
               if (ch === 'q' && next === 'u') {
                   const next2 = (i < word.length - 2) ? word[i+2] : '';
                   if (next2 === 'e' || next2 === 'é' || next2 === 'ê' || next2 === 'i' || next2 === 'í') {
                       phonemes.push('k');
                       i += 2;
                       continue;
                   }
                   // 'qu' + a/o -> 'u' prononcé [w] (ex: "quando" -> [ˈkwɐ̃du])
                   // On traitera le 'u' comme semi-voyelle plus tard.
               }
               // Combinaisons de voyelle + ~ + voyelle (diphtongues nasales marquées par tilde)
               // 'ão'
               if ((ch === 'ã' || ch === 'Ã') && next === 'o') {
                   phonemes.push('ã');  // [ɐ̃]
                   phonemes.push('w');  // [w] correspond à la semi-voyelle finale nasale
                   i += 2;
                   continue;
               }
               // 'ãe' ou 'ãi'
               if ((ch === 'ã' || ch === 'Ã') && (next === 'e' || next === 'i')) {
                   phonemes.push('ã');  // [ɐ̃]
                   phonemes.push('j');  // [j] comme semi-voyelle nasale
                   i += 2;
                   continue;
               }
               // 'õe'
               if ((ch === 'õ' || ch === 'Õ') && next === 'e') {
                   phonemes.push('õ');  // [õ]
                   phonemes.push('j');  // [j̃] ~ [j]
                   i += 2;
                   continue;
               }
   
               // 2. Gestion des lettres individuelles
               // Voyelles (avec ou sans accent)
               if (isVowel(ch) || ch === 'ü') {
                   // Déterminer la voyelle de base sans accent/diacritique:
                   let baseVowel = ch;
                   // Normalisation des variantes accentuées vers leur base orale:
                   if ('áàâ'.includes(ch)) baseVowel = 'a';
                   if ('éêè'.includes(ch)) baseVowel = 'e';
                   if (ch === 'í' || ch === 'ï') baseVowel = 'i';
                   if ('óô'.includes(ch)) baseVowel = 'o';
                   if (ch === 'ú') baseVowel = 'u';
                   if (ch === 'ã') baseVowel = 'ã';
                   if (ch === 'õ') baseVowel = 'õ';
   
                   // Voyelle nasalisée par un 'm' ou 'n' qui suit ?
                   if ((next === 'm' || next === 'n')) {
                       const next2 = (i < word.length - 2) ? word[i+2] : '';
                       if (!next2 || !isVowel(next2)) {
                           // 'm' ou 'n' en fin de mot ou devant consonne -> nasalise la voyelle
                           switch(baseVowel) {
                               case 'a': phonemes.push('ã'); break;
                               case 'e': phonemes.push('ẽ'); break;
                               case 'i': phonemes.push('ĩ'); break;
                               case 'o': phonemes.push('õ'); break;
                               case 'u': phonemes.push('ũ'); break;
                               default: phonemes.push(baseVowel);
                           }
                           // Le 'm'/'n' ne se prononce pas comme consonne distincte (il est consommé par la nasalisation)
                           i += 2;
                           continue;
                       }
                       // Si un 'm'/'n' est suivi d'une voyelle, la voyelle actuelle n'est pas nasale, on traitera 'm'/'n' comme consonne séparée.
                   }
   
                   // Voyelle orale normale:
                   // Réduction des voyelles finales inaccentuées :
                   // Si voyelle en fin de mot (ou suivie seulement de 's' final), adapter a->ɐ, e->i, o->u (propres au portugais brésilien)
                   const isLastVowel = !next || next === 's';
                   if (isLastVowel) {
                       if (baseVowel === 'a') baseVowel = 'a';   // on pourrait mapper à un son [ɐ], mais visème identique à [a]
                       if (baseVowel === 'e') baseVowel = 'i';   // ex: "telefone" -> [telefoni] -> on utilise 'i'
                       if (baseVowel === 'o') baseVowel = 'u';   // ex: "carro" -> [ˈkaʁu] -> on utilise 'u'
                   }
                   phonemes.push(baseVowel);
                   i++;
                   continue;
               }
   
               // Consonnes
               switch(ch) {
                   case 'p': case 'b': case 't': case 'd':
                   case 'k': case 'g': case 'f': case 'v':
                       // Consonnes dont la prononciation correspond directement à la lettre (p, b, t, d, k, g, f, v)
                       phonemes.push(ch === 'k' ? 'k' : ch);
                       // (Note: 'c' et 'g' sont traités plus loin selon voyelle suivante, 'k' est pour 'q' déjà traité)
                       i++;
                       break;
                   case 'c':
                       if (next === 'e' || next === 'é' || next === 'ê' || next === 'i' || next === 'í') {
                           // 'c' doux devant e, i -> [s]
                           phonemes.push('s');
                       } else {
                           // 'c' dur (devant a, o, u) -> [k]
                           phonemes.push('k');
                       }
                       i++;
                       break;
                   case 'h':
                       // 'h' est muet (s'il n'a pas fait partie de 'ch', 'nh', etc.)
                       i++;
                       break;
                   case 'j':
                       // 'j' -> [ʒ] (comme le 'j' français dans "jour")
                       phonemes.push('ʒ');
                       i++;
                       break;
                   case 'x':
                       // 'x' a plusieurs prononciations possibles. On applique des règles simplifiées :
                       // - en début de mot : [ʃ] ex: "xícara" -> [ʃikɐɾɐ]
                       // - entre voyelles : souvent [z] ex: "exame" -> [ezame]
                       // - devant consonne : souvent [s] ex: "experto" -> [esperto]
                       // (NB: Ces règles ne couvrent pas tous les cas, 'x' étant irrégulier selon les mots.)
                       if (i === 0) {
                           phonemes.push('ʃ');
                       } else if (isVowel(prev) && isVowel(next)) {
                           phonemes.push('z');
                       } else {
                           phonemes.push('s');
                       }
                       i++;
                       break;
                   case 's':
                       if (!next) {
                           // 's' final -> [s] (non voisé en fin de mot)
                           phonemes.push('s');
                       } else {
                           // Regarder le caractère suivant pour décider de la prononciation
                           // Si le prochain son est une voyelle ou une consonne voisée, on sonorise [z], sinon [s].
                           const nextChar = next;  // (next est une lettre déjà)
                           if (isVowel(nextChar) || "bdgvzmnlɲʒʁ".includes(nextChar)) {
                               phonemes.push('z');
                           } else {
                               phonemes.push('s');
                           }
                       }
                       i++;
                       break;
                   case 'z':
                       if (!next) {
                           // 'z' final en portugais brésilien se prononce [s] (ex: "faz" -> [fas])
                           phonemes.push('s');
                       } else {
                           phonemes.push('z');
                       }
                       i++;
                       break;
                   case 'm': case 'n':
                       // 'm' ou 'n' consonne (non nasalisation) : 
                       // Cas ici: 'm'/'n' suivis d'une voyelle (sinon ils seraient traités plus haut comme nasalisation).
                       // On prononce [m] ou [n] standard.
                       phonemes.push(ch === 'm' ? 'm' : 'n');
                       i++;
                       break;
                   case 'l':
                       if (!next || !isVowel(next)) {
                           // 'l' en fin de mot ou avant consonne -> [w] semi-voyelle (ex: "sol" -> [sɔw])
                           phonemes.push('w');
                       } else {
                           // 'l' suivi d'une voyelle -> [l] normal
                           phonemes.push('l');
                       }
                       i++;
                       break;
                   case 'r':
                       // 'r' simple. S'il est en début de mot (ou après espace) ou précédé d'une consonne sans voyelle avant (début de syllabe),
                       // on le considère comme un 'r' fort [ʁ]. Sinon comme un 'r' doux [ɾ].
                       if (i === 0 || (!isVowel(prev) && prev !== '' && prev !== ' ')) {
                           // r en position initiale de mot ou de syllabe sans voyelle précédente -> fort
                           phonemes.push('ʁ');
                       } else {
                           phonemes.push('ɾ');
                       }
                       i++;
                       break;
                   case 'ç':
                       // 'ç' se prononce [s]
                       phonemes.push('s');
                       i++;
                       break;
                   case 'y':
                       // 'y' n'est pas fréquent. On le traite soit comme [i], soit comme [j].
                       if (i === 0 || (prev && !isVowel(prev) && isVowel(next))) {
                           // début de mot ou après consonne et avant voyelle -> [j]
                           phonemes.push('j');
                       } else {
                           // sinon comme une voyelle [i]
                           phonemes.push('i');
                       }
                       i++;
                       break;
                   default:
                       // Caractère non prévu (on peut l'ignorer ou l'ajouter tel quel)
                       i++;
                       break;
               }
           }
   
           return phonemes;
       }
   
       /**
        * Convertit une phrase (après pré-traitement) en séquence de visèmes.
        * Segmente en mots, convertit chaque mot en phonèmes puis chaque phonème en visème.
        * Gère certains enchaînements entre mots (liaison du 's' final etc.).
        * @param text Chaîne de texte à convertir (pré-traitée ou non; la fonction appellera preProcessText si nécessaire).
        * @return Tableau des visèmes correspondants, dans l'ordre.
        */
       public wordsToVisemes(text: string): string[] {
           // Assurer que le texte est pré-traité
           const processedText = this.preProcessText(text);
           const words = processedText.split(' ');
           const visemesSequence: string[] = [];
   
           for (let w = 0; w < words.length; w++) {
               const word = words[w];
               if (!word) continue;
               // Convertir en phonèmes
               const phonemes = this.wordToPhonemes(word);
               // Si liaison: si ce mot-ci se termine par un 's' non voisé et que le suivant commence par une voyelle, sonoriser.
               if (w < words.length - 1 && phonemes.length > 0) {
                   const nextWord = words[w+1];
                   if (phonemes[phonemes.length - 1] === 's' && nextWord && nextWord.length > 0) {
                       const nextFirst = nextWord[0];
                       if (nextFirst && nextFirst.match(/^[aeiouãõáéíóúâêô]/)) {
                           // transformer [s] final en [z] pour la liaison
                           phonemes[phonemes.length - 1] = 'z';
                       }
                   }
                   // (On pourrait ajouter: si mot finit par 'r' et prochain commence par voyelle, éventuellement garder le r sonore)
               }
               // Traduire chaque phonème en visème via la table
               for (const ph of phonemes) {
                   const viseme = this.phonemeToViseme[ph];
                   if (viseme) {
                       visemesSequence.push(viseme);
                   } else {
                       // Si phonème inconnu dans la table, on peut l'ignorer ou mettre visème neutre
                       visemesSequence.push("sil"); // par défaut, silence/neutre si non reconnu
                   }
               }
           }
   
           return visemesSequence;
       }
   }
   