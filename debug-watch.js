// Script de diagnostic pour identifier les fichiers qui déclenchent des rechargements 
import chokidar from 'chokidar';

const watcher = chokidar.watch('.', {
  ignored: /(^|[\/\\])\..|(node_modules|dist|.git)/,
  persistent: true,
  ignoreInitial: true
});

console.log('🔍 Surveillance des changements de fichiers...\n');

let changeCount = 0;
const recentChanges = new Map();

watcher
  .on('change', path => {
    changeCount++;
    const now = Date.now();
    const lastChange = recentChanges.get(path) || 0;
    const timeSinceLastChange = now - lastChange;
    
    recentChanges.set(path, now);
    
    console.log(`[${new Date().toLocaleTimeString()}] Changement #${changeCount}: ${path}`);
    
    if (timeSinceLastChange < 6000 && timeSinceLastChange > 0) {
      console.log(`⚠️  SUSPECT: Ce fichier a changé ${Math.round(timeSinceLastChange/1000)}s après le dernier changement`);
    }
  })
  .on('add', path => console.log(`➕ Fichier ajouté: ${path}`))
  .on('unlink', path => console.log(`➖ Fichier supprimé: ${path}`));

console.log('Appuyez sur Ctrl+C pour arrêter la surveillance.\n');
