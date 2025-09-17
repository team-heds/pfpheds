/**
 * Classe LipsyncFrCh – Module de synchronisation labiale pour le français (Suisse).
 * Inspiré de LipsyncEn, adapté aux spécificités du français suisse (septante, huitante, nonante, accents, liaisons, h aspiré).
 */
class LipsyncFr {
  constructor() {
      // Correspondance phonèmes -> visèmes (Oculus OVR LipSync codes)
      // On mappe chaque phonème français à un code de visème standard Oculus.
      this.phonemeToViseme = {
          // Voyelles orales
          'a': 'aa',   // phonème /a/ → bouche grande ouverte
          'e': 'E',    // phonème /e/ (é) → visème "E"
          'ɛ': 'E',    // phonème /ɛ/ (è, ê) → visème "E"
          'i': 'I',    // phonème /i/ → visème "I" (sourire étiré)
          'o': 'O',    // phonème /o/ → visème "O"
          'ɔ': 'O',    // phonème /ɔ/ (o ouvert) → visème "O"
          'u': 'U',    // phonème /u/ (son [ou]) → visème "U"
          'y': 'U',    // phonème /y/ (u français) → visème "U" (lèvres très arrondies)
          'œ': 'O',    // phonème /œ/ /ø/ (eu) → on utilise visème "O" par simplification
          // Voyelles nasales (même forme de bouche que les voyelles orales correspondantes)
          'ɑ̃': 'aa',  // /ɑ̃/ (an, en) → visème "aa"
          'ɛ̃': 'E',   // /ɛ̃/ (in, ain) → visème "E"
          'ɔ̃': 'O',   // /ɔ̃/ (on) → visème "O"
          'œ̃': 'O',   // /œ̃/ (un) → visème "O"
          // Semi-voyelles (approximantes)
          'w': 'U',    // /w/ (ou as [w] dans "oui") → lèvres arrondies (proche de "U")
          'ɥ': 'U',    // /ɥ/ (u as [ɥ] dans "huit") → visème "U"
          'j': 'I',    // /j/ (yod, comme « y » dans "fille") → visème "I"
          // Consonnes
          'p': 'PP', 'b': 'PP', 'm': 'PP',   // bilabiales → lèvres fermées (visème "PP")
          'f': 'FF', 'v': 'FF',             // labiodentales → lèvre sur dents (visème "FF")
          't': 'DD', 'd': 'DD', 'l': 'DD',  // apico-dentales (t, d, l) → langue contre dents (visème "DD")
          'k': 'kk', 'g': 'kk',             // vélaire (k, g) → visème "kk"
          's': 'SS', 'z': 'SS',             // alvéo-dentales constrictives (s, z) → visème "SS"
          'ʃ': 'CH', 'ʒ': 'CH',             // ch/j (ch, ge) → visème "CH" (lèvres en avant)
          'ɲ': 'nn', 'n': 'nn',             // nasales (n, gn) → langue au palais (visème "nn")
          'r': 'RR',                        // /r/ (r français, uvulaire) → on utilise visème "RR"
          // Silence ou inconnu
          'sil': 'sil',                     // silence
          '?': 'sil'                        // tout phonème inconnu traité comme silence
      };

      // Liste de mots commençant par un h aspiré (pas de liaison ni d'élision)
      this.aspiratedHWords = new Set([
  "hache", "hachis", "hachoir", "hachure", "hagard", "haie", "haillon", "haine", "haïr",
    "haïtien", "haler", "haleter", "hall", "halle", "hallebarde", "halo", "hamac", "hamburger",
    "hameau", "hampe", "hamster", "hanche", "handicap", "hangar", "hanneton", "hanter", "happe",
    "harangue", "harceler", "harde", "hardes", "hardi", "hareng", "harfang", "haricot", "hargne",
    "harnais", "harpe", "hasard", "hase", "hausse", "haut", "hautain", "hauteur", "havane",
    "havre", "héler", "hennir", "hennissement", "hérisser", "hérisson", "héros", "hêtre", 
    "heurter", "hibou", "hideux", "hiérarchie", "hisser", "hobby", "hockey", "hocher", "hollandais",
    "hollande", "homard", "hongre", "honte", "hoquet", "horde", "hors", "houblon", "houille", 
    "houle", "houspiller", "housse", "hublot", "huche", "huer", "huée", "huguenot", "huit", "huitaine",
    "huître", "hulotte", "humble", "humer", "hurler", "hurlement", "hussard", "hutte", "hyène"
          // ... (liste à compléter avec d'autres mots à h aspiré si nécessaire)
      ]);

      // Lexiques de base pour conversion des nombres (unités, dizaines spécifiques suisse)
      this.units = {
          0: "zéro", 1: "un", 2: "deux", 3: "trois", 4: "quatre",
          5: "cinq", 6: "six", 7: "sept", 8: "huit", 9: "neuf",
          10: "dix", 11: "onze", 12: "douze", 13: "treize",
          14: "quatorze", 15: "quinze", 16: "seize"
        };
        
      this.tens = {
          20: "vingt", 30: "trente", 40: "quarante",
          50: "cinquante", 60: "soixante",
          70: "septante", 80: "huitante", 90: "nonante"  // formes suisses
      };
  }

  /**
   * Prétraiter le texte en entrée:
   *  - Conversion des nombres en toutes lettres (avec septante/huitante/nonante).
   *  - Remplacement des caractères spéciaux et ponctuations inutiles.
   *  - Passage en minuscules pour uniformiser.
   * Retourne le texte nettoyé et prêt pour l'analyse phonétique.
   */
  preProcessText(text) {
      if (!text) return "";

      // Remplacement des retours à la ligne et tabulations par des espaces
      let cleaned = text.replace(/\s+/g, " ");

      // Conversion des nombres numériques en mots (en toutes lettres)
      // On cherche les séquences de chiffres et on les remplace
      cleaned = cleaned.replace(/\d+/g, (match) => {
          // Convertit le nombre entier en mots français (prononciation suisse)
          let num = parseInt(match, 10);
          return isNaN(num) ? match : this.numberToWords(num);
      });

      // Gestion des caractères spéciaux: on s'assure que les lettres accentuées sont bien présentes.
      // (Ici, toLowerCase préserve les accents en JavaScript)
      cleaned = cleaned.toLowerCase();

      // Remplacement de la ponctuation par des espaces (pour séparer les mots)
      cleaned = cleaned.replace(/[.,!?;:/\"\(\)\[\]]/g, " ");

      // Trim des espaces superflus en début/fin
      cleaned = cleaned.trim();
      return cleaned;
  }

  /**
   * Convertit un nombre entier (<= 999999 etc.) en sa représentation textuelle française (suisse).
   * Par exemple: 71 -> "septante et un", 80 -> "huitante", 95 -> "nonante-cinq".
   */
  numberToWords(num) {
      // Cas de base pour les petits nombres
      if (num < 0) return "";  // (pas de support des négatifs ici)
      if (num <= 16) {
          return this.units[num];
      }
      if (num < 20) {
          // 17, 18, 19
          return "dix-" + this.units[num - 10];  // ex: 17 -> "dix-sept"
      }
      if (num < 100) {
          let tens = Math.floor(num / 10) * 10;
          let ones = num % 10;
          let tensWord = this.tens[tens]; // ✅ remplacer "this.tens[tens]" par "this.tens[tens]"
          if (ones === 0) {
              // Nombre rond (20,30,...90)
              return tensWord;
          } else if (ones === 1) {
              // 21, 31, ... 91 utilisent "et un"
              return tensWord + " et un";
          } else {
              // Autres (22-29, 32-39, ..., 92-99) -> on utilise un tiret
              return tensWord + "-" + this.units[ones];
          }
      }
      if (num < 1000) {
          let hundreds = Math.floor(num / 100);
          let rest = num % 100;
          let hundredsWord = "";
          if (hundreds === 1) {
              hundredsWord = "cent";
          } else {
              hundredsWord = this.units[hundreds] + " cent";
          }
          // Pluriel de "cent": si pas de reste et plus d'un cent (ex: 200, 300... prononcés "deux cents")
          if (hundreds > 1 && rest === 0) {
              hundredsWord += "s";
          }
          if (rest !== 0) {
              // Ajoute la suite du nombre après 100 (avec un espace)
              return hundredsWord + " " + this.numberToWords(rest);
          } else {
              return hundredsWord;
          }
      }
      if (num < 1000000) {
          // Gestion des milliers
          let thousands = Math.floor(num / 1000);
          let rest = num % 1000;
          let thousandsWord = "";
          if (thousands === 1) {
              thousandsWord = "mille";
          } else {
              thousandsWord = this.numberToWords(thousands) + " mille";
          }
          if (rest !== 0) {
              return thousandsWord + " " + this.numberToWords(rest);
          } else {
              return thousandsWord;
          }
      }
      // Pour les très grands nombres, on pourrait étendre (millions, etc.), ici on se limite.
      return num.toString();
  }

  /**
   * Convertit un texte en séquence de visèmes avec leur chronologie relative.
   * Renvoie un objet { visemes: [...], times: [...], durations: [...] }.
   * - Applique le prétraitement du texte.
   * - Découpe en mots, génère la liste des phonèmes mot par mot.
   * - Convertit phonèmes->visèmes et calcule des timestamps relatifs.
   */
  wordsToVisemes(text) {
      // Étape 1: prétraitement du texte
      let input = this.preProcessText(text);
      if (!input) {
          // Si texte vide après nettoyage, on renvoie des tableaux vides
          return { visemes: [], times: [], durations: [] };
      }

      // Séparation des mots par les espaces (les ponctuations ont été remplacées par des espaces)
      let words = input.split(/\s+/);

      // Listes résultantes des visèmes et timings
      let visemes = [];
      let times = [];
      let durations = [];
      let currentTime = 0;

      // Parcours mot à mot
      for (let i = 0; i < words.length; i++) {
          let word = words[i];
          if (!word) continue;
          // Mot suivant (pour gérer la liaison éventuelle)
          let nextWord = (i < words.length - 1) ? words[i + 1] : null;

          // Conversion du mot en liste de phonèmes (en prenant en compte liaisons/h aspiré)
          let phonemes = this.wordToPhonemes(word, nextWord);

          // Conversion des phonèmes en visèmes + timing
          for (let ph of phonemes) {
              // Visème correspondant au phonème
              let viseme = this.phonemeToViseme[ph] || this.phonemeToViseme['?'];
              if (!viseme) viseme = 'sil';  // sécurité: si non défini, silence
              visemes.push(viseme);
              times.push(currentTime);

              // Durée relative du visème: on peut moduler selon le type de phonème
              // Ici on donne une durée plus longue aux voyelles qu'aux consonnes.
              let duration = this.isVowel(ph) ? 2 : 1;
              durations.push(duration);

              // Incrément du temps courant avant le prochain visème
              currentTime += 1;
          }
      }

      // Ajout d'un visème de silence à la fin pour fermer la bouche
      visemes.push('sil');
      times.push(currentTime);
      durations.push(1);

      return { visemes, times, durations };
  }

  // Méthode utilitaire pour détecter si un symbole phonétique est une voyelle (orale, nasale ou semi-voyelle).
  isVowel(phoneme) {
      const vowels = new Set(['a','e','ɛ','i','o','ɔ','u','y','œ',
                               'ɑ̃','ɛ̃','ɔ̃','œ̃',  // voyelles nasales
                               'w','ɥ','j'          // semi-voyelles
                              ]);
      return vowels.has(phoneme);
  }

  /**
   * Convertit un mot en une liste de phonèmes.
   * Gère les règles phonétiques françaises, les accents, les digrammes/trigrammes, les liaisons et le h aspiré.
   */
  wordToPhonemes(word, nextWord) {
      let phonemes = [];

      // Parcours des caractères du mot avec prise en compte des digrammes/trigrammes
      for (let i = 0; i < word.length; i++) {
          let c = word[i];

          // Ignorer les caractères de liaison non prononcés
          if (c === '\'' || c === '’' || c === '-') {
              // Apostrophe (l', d', etc.) ou tiret: pas de son associé.
              continue;
          }

          // ==== Traitement des combinaisons de lettres (digrammes, trigrammes) ====

          // 1. Combinaison "ch" -> phonème /ʃ/ (comme "chat")
          if (c === 'c' && i < word.length - 1 && word[i+1] === 'h') {
              phonemes.push('ʃ');
              i++; // on saute le 'h'
              continue;
          }

          // 2. Combinaison "ph" -> phonème /f/ (comme "photo")
          if (c === 'p' && i < word.length - 1 && word[i+1] === 'h') {
              phonemes.push('f');
              i++; // on saute le 'h'
              continue;
          }

          // 3. Combinaison "gn" -> phonème /ɲ/ (comme "montagne")
          if (c === 'g' && i < word.length - 1 && word[i+1] === 'n') {
              phonemes.push('ɲ');
              i++; // on saute le 'n'
              continue;
          }

          // 4. Combinaisons contenant 'i':
          //    "ill" après voyelle -> phonème /j/ (ex: "fille" -> /fij/)
          if (c === 'i' && i < word.length - 2 && word[i+1] === 'l' && word[i+2] === 'l') {
              // On vérifie si une voyelle précède "ill" (optionnel, on simplifie en transformant toujours "ill" en /j/)
              phonemes.push('j');
              i += 2; // on saute 'ill'
              continue;
          }
          //    "ion" (fin de mot ou devant consonne) -> /jɔ̃/ (ex: "nation" -> /nasjɔ̃/)
          // On repère "ion" comme séquence
          if (c === 'i' && i < word.length - 2 && word[i+1] === 'o' && word[i+2] === 'n') {
              phonemes.push('j');
              phonemes.push('ɔ');  // on ajoute /j/ puis /ɔ/ (le 'n' final sera géré par nasalisation plus tard)
              i += 1; // on avance d'une lettre (on laissera le 'n' être traité par la logique de nasalisation)
              continue;
          }
          //    "oi" -> phonèmes /w/ + /a/ (ex: "moi" -> /mwa/)
          if (c === 'o' && i < word.length - 1 && word[i+1] === 'i') {
              phonemes.push('w');
              phonemes.push('a');
              i++; // saute 'i'
              continue;
          }
          //    "ou" -> phonème /u/ (ex: "tout" -> /tu/)
          if (c === 'o' && i < word.length - 1 && word[i+1] === 'u') {
              phonemes.push('u');
              i++; // saute 'u'
              continue;
          }
          //    "eu" -> phonème /œ/ (on prend le son "eu" ouvert par défaut)
          if (c === 'e' && i < word.length - 1 && word[i+1] === 'u') {
              phonemes.push('œ');
              i++; // saute 'u'
              continue;
          }
          //    "au" -> phonème /o/ (ex: "jaune" -> /ʒon/)
          if (c === 'a' && i < word.length - 1 && word[i+1] === 'u') {
              phonemes.push('o');
              i++; // saute 'u'
              continue;
          }
          //    "eau" -> phonème /o/ (ex: "beau" -> /bo/)
          if (c === 'e' && i < word.length - 2 && word[i+1] === 'a' && word[i+2] === 'u') {
              phonemes.push('o');
              i += 2; // saute 'a' et 'u'
              continue;
          }
          //    "ai", "ei" -> phonème /ɛ/ (ex: "lait" -> /lɛ/, "seize" -> /sɛz/)
          if ((c === 'a' || c === 'e') && i < word.length - 1 && word[i+1] === 'i') {
              phonemes.push('ɛ');
              i++; // saute 'i'
              continue;
          }

          // ==== Traitement des lettres individuelles ====

          switch(c) {
              // Voyelles simples et accentuées
              case 'a':
              case 'à':
              case 'â':
                  phonemes.push('a');
                  break;
              case 'e':
                  // 'e' muet en fin de mot : ne se prononce pas
                  if (i === word.length - 1) {
                      // Dernière lettre 'e' muet : on ne l'ajoute pas comme phonème.
                      // (Il sert toutefois à prononcer la consonne précédente, géré plus loin dans liaison/nasalisation)
                      break;
                  }
                  // 'e' non final: on le considère comme /ə/ ou /ɛ/.
                  // Pour simplifier, on utilise /ɛ/ pour un 'e' non accentué dans une syllabe fermée.
                  phonemes.push('ɛ');
                  break;
              case 'é':
                  phonemes.push('e'); // é fermé
                  break;
              case 'è':
              case 'ê':
              case 'ë':
                  phonemes.push('ɛ'); // è ouvert
                  break;
              case 'i':
              case 'î':
              case 'ï':
                  phonemes.push('i');
                  break;
              case 'o':
              case 'ô':
                  phonemes.push('o');
                  break;
              case 'ö':  // 'ö' rare en français, on le traite comme 'o' ouvert
                  phonemes.push('ɔ');
                  break;
              case 'u':
              case 'û':
              case 'ü': // 'ü' (tréma) traité comme 'u' également
                  // 'u' isolé correspond au son /y/ (l'u français)
                  phonemes.push('y');
                  break;
              case 'ù':
                  phonemes.push('y');
                  break;
              case 'y':
                  // 'y' employé comme voyelle (ex: "type") se prononce /i/
                  // Simplification: on le traite comme /i/
                  phonemes.push('i');
                  break;
              case 'œ': case 'ø':
                  // lettre œ (comme dans "cœur") ou ø (peut apparaître en minuscule) -> son /œ/
                  phonemes.push('œ');
                  break;

              // Consonnes
              case 'b':
                  phonemes.push('b');
                  break;
              case 'c':
                  // c dur ou doux
                  if (i < word.length - 1 && ['e','é','è','ê','i','y'].includes(word[i+1])) {
                      // c devant e, i, y => /s/ (c cédille implicite)
                      phonemes.push('s');
                  } else {
                      // c ailleurs => /k/
                      phonemes.push('k');
                  }
                  break;
              case 'ç': // c cédille => /s/
                  phonemes.push('s');
                  break;
              case 'd':
                  phonemes.push('d');
                  break;
              case 'f':
                  phonemes.push('f');
                  break;
              case 'g':
                  // g doux ou dur
                  if (i < word.length - 1 && ['e','é','è','ê','i','y'].includes(word[i+1])) {
                      // g devant e, i, y => /ʒ/
                      phonemes.push('ʒ');
                  } else {
                      // g ailleurs => /g/
                      phonemes.push('g');
                  }
                  break;
              case 'h':
                  // Le 'h' n'a pas de son propre en français.
                  // S'il s'agit d'un h aspiré, il empêche les liaisons mais ne se prononce pas.
                  // S'il est muet, il est déjà ignoré.
                  // Dans les deux cas, on ne produit pas de phonème pour 'h'.
                  break;
              case 'j':
                  // La lettre 'j' en français se prononce /ʒ/
                  phonemes.push('ʒ');
                  break;
              case 'k':
                  phonemes.push('k');
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
                  // 'qu' se prononce /k/ (le 'u' qui suit sert juste à marquer le son [k])
                  if (i < word.length - 1 && word[i+1] === 'u') {
                      phonemes.push('k');
                      i++; // sauter 'u' de "qu"
                  } else {
                      phonemes.push('k');
                  }
                  break;
              case 'r':
                  phonemes.push('r');
                  break;
              case 's':
                  // 's' intervocalique (entre deux voyelles) se prononce [z], sinon [s]
                  if (i > 0 && i < word.length - 1 && this.isVowel(word[i-1]) && this.isVowel(word[i+1])) {
                      phonemes.push('z');
                  } else {
                      phonemes.push('s');
                  }
                  break;
              case 't':
                  phonemes.push('t');
                  break;
              case 'v':
                  phonemes.push('v');
                  break;
              case 'w':
                  // 'w' en français peut sonner comme /v/ dans quelques mots d'origine germanique (ex: wagon -> /vagon/).
                  // Par simplification, on le traite comme /w/ (cas de "water polo" par ex).
                  phonemes.push('w');
                  break;
              case 'x':
                  // 'x' se prononce généralement /ks/ (ex: "taxi" -> /taksi/) ou /gz/ en début de mot ("xylophone" -> /gzilo-/).
                  // On simplifie en /ks/.
                  phonemes.push('k');
                  phonemes.push('s');
                  break;
              case 'y': 
                  // (déjà traité plus haut dans voyelles, ici on n'arrive normalement pas car 'y' a été pris comme voyelle)
                  phonemes.push('i');
                  break;
              case 'z':
                  phonemes.push('z');
                  break;
              default:
                  // Caractère non prévu (par exemple symbole) -> ignoré
                  break;
          }
      } // fin du parcours des lettres

      // ==== Post-traitements phonétiques ====

      // 1. Gestion des voyelles nasales:
      // Si le mot se termine par un n/m précédé d'une voyelle, on nasalise la voyelle et on supprime le n/m final.
      if (phonemes.length >= 2) {
          let lastPh = phonemes[phonemes.length - 1];
          let prevPh = phonemes[phonemes.length - 2];
          if ((lastPh === 'n' || lastPh === 'm') && this.isVowel(prevPh)) {
              // Retirer le 'n' ou 'm' final
              phonemes.pop();
              // Marquer la voyelle précédente comme nasale (optionnel, ici on garde le même symbole car visème identique)
              // On pourrait modifier prevPh pour indiquer nasal (ex: 'ɑ̃' au lieu de 'a'), mais pour les visèmes ce sera traité comme 'a'.
              // (On laisse le phonème précédent tel quel, sachant qu'il représente désormais une voyelle nasale)
          }
      }

      // 2. Gestion de la liaison en fin de mot:
      if (nextWord) {
          // On décide si on doit ajouter un phonème de liaison en fonction du dernier caractère du mot courant et du premier du mot suivant.
          let lastChar = word[word.length - 1];
          let firstNext = nextWord.charAt(0);
          // Vérifier si le prochain mot commence par un son vocalique (voyelle ou h muet)
          let nextStartsWithVowelSound = false;
          if (firstNext) {
              const vowels = "aeiouyâêîôûäëïöüàèùéœæ";
              if (vowels.includes(firstNext)) {
                  nextStartsWithVowelSound = true;
              } else if (firstNext === 'h') {
                  // Si c'est un 'h', vérifier s'il est muet ou aspiré via la liste
                  let lowercaseNext = nextWord.toLowerCase();
                  if (!this.aspiratedHWords.has(lowercaseNext)) {
                      // h muet: compte comme voyelle pour la liaison
                      nextStartsWithVowelSound = true;
                  }
              }
          }
          if (nextStartsWithVowelSound) {
              // Ajouter le phonème de liaison selon la terminaison du mot
              if (lastChar === 's' || lastChar === 'x') {
                  // liaison s/x -> [z]
                  phonemes.push('z');
              } else if (lastChar === 'd') {
                  // liaison d -> [t] (ex: "grand arbre" -> /gran t-arbr/)
                  phonemes.push('t');
              } else if (lastChar === 't') {
                  // liaison t -> [t] (ex: "pot-au-feu", 't' prononcé)
                  phonemes.push('t');
              } else if (lastChar === 'n') {
                  // liaison n: si voyelle nasale, on prononce le n (ex: "un ami" -> /œ̃n ami/)
                  phonemes.push('n');
              } else if (lastChar === 'g') {
                  // liaison g -> [g] (rare, ex: "sang impur" -> /sɑ̃ gɛ̃pyr/)
                  phonemes.push('g');
              } else if (lastChar === 'p') {
                  // liaison p -> [p] (ex: "trop aimable" -> /tro pɛmabl/)
                  phonemes.push('p');
              }
              // (Note: cas de 'r' final muet -> ex: "hiver éternel" : on pourrait ajouter [r], mais ce cas est rare en liaison)
          }
      }

      return phonemes;
  }
}
export { LipsyncFr};