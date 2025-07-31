# 🏛️ Documentation d'Architecture - Plateforme HEdS (Suite)
## Sections 9-18 : Base de Données, Migration, Déploiement et Infrastructure

---

## 9. Base de Données

### 9.1 Architecture Firebase Realtime Database (Actuelle)

Firebase Realtime Database est une base de données NoSQL en temps réel qui synchronise automatiquement les données entre tous les clients connectés. Elle utilise une structure JSON hiérarchique optimisée pour les applications temps réel.

**Caractéristiques Techniques :**
- **Type** : NoSQL Document-oriented (JSON)
- **Synchronisation** : Temps réel bidirectionnelle
- **Offline** : Support hors ligne avec synchronisation automatique
- **Sécurité** : Firebase Security Rules
- **Scalabilité** : Horizontale avec sharding automatique

### 9.2 Structure de la Base de Données

La structure suit une hiérarchie optimisée pour les requêtes temps réel et la dénormalisation nécessaire aux bases NoSQL.

```json
{
  "users": {
    "userId": {
      "email": "etudiant@hevs.ch",
      "displayName": "Jean Dupont",
      "role": "student",
      "profile": {
        "avatar": "https://storage.googleapis.com/pfpheds.appspot.com/avatars/userId.jpg",
        "bio": "Étudiant en physiothérapie 3ème année",
        "institution": "institutionId",
        "phone": "+41 27 123 45 67"
      },
      "preferences": {
        "theme": "light",
        "notifications": true,
        "language": "fr"
      },
      "academic": {
        "year": 3,
        "specialization": "neurologie",
        "supervisor": "teacherId"
      },
      "createdAt": 1640995200000,
      "isActive": true
    }
  },
  "institutions": {
    "institutionId": {
      "name": "Hôpital du Valais - Site de Sion",
      "type": "hospital",
      "address": {
        "street": "Avenue Grand-Champsec 80",
        "city": "Sion",
        "zipCode": "1951",
        "canton": "VS"
      },
      "coordinates": {
        "latitude": 46.2276,
        "longitude": 7.3467
      },
      "contact": {
        "phone": "+41 27 603 40 00",
        "email": "info@hopitalvs.ch"
      },
      "departments": {
        "physio": {
          "name": "Service de Physiothérapie",
          "capacity": 8,
          "specializations": ["neurologie", "orthopédie"]
        }
      }
    }
  },
  "posts": {
    "postId": {
      "authorId": "userId",
      "content": "Partage d'expérience sur mon stage...",
      "type": "experience",
      "visibility": "public",
      "tags": ["neurologie", "stage"],
      "likes": {
        "userId1": { "timestamp": 1709251200000 }
      },
      "comments": {
        "commentId": {
          "authorId": "userId2",
          "content": "Très intéressant !",
          "createdAt": 1709251350000
        }
      },
      "createdAt": 1709251200000
    }
  }
}
```

---

## 10. Migration Firebase vers Supabase

### 10.1 Stratégie de Migration

La migration vers Supabase apporte les avantages d'une base PostgreSQL relationnelle tout en conservant les fonctionnalités temps réel.

**Avantages :**
- **Performance** : PostgreSQL plus rapide pour requêtes complexes
- **Coûts** : Pricing plus prévisible
- **Flexibilité** : SQL standard et relations
- **Open Source** : Pas de vendor lock-in

### 10.2 Schéma PostgreSQL Cible

```sql
-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  academic_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institutions
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  address JSONB NOT NULL,
  coordinates POINT,
  contact JSONB,
  departments JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  visibility VARCHAR(20) DEFAULT 'public',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
```

---

## 11. Configuration Vite et Build

### 11.1 Configuration Optimisée

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5177
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },
      manifest: {
        name: 'Plateforme HEdS',
        short_name: 'HEdS',
        theme_color: '#0B213F',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['primevue'],
          editor: ['@tiptap/vue-3', '@tiptap/starter-kit'],
          maps: ['leaflet'],
          charts: ['chart.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

---

## 12. Déploiement et Infrastructure VPS

### 12.1 Architecture VPS Infomaniak

L'application est hébergée sur un VPS Infomaniak (https://hedsvs.ch) avec une architecture containerisée Docker pour assurer la scalabilité et la maintenance.

**Spécifications VPS :**
- **Provider** : Infomaniak (Suisse)
- **URL** : https://hedsvs.ch
- **OS** : Ubuntu 22.04 LTS
- **RAM** : 8GB
- **CPU** : 4 vCores
- **Storage** : 160GB SSD
- **Bande passante** : 1Gbps

### 12.2 Architecture Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: heds-frontend
    restart: always
    networks:
      - heds-network
    expose:
      - "80"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: heds-backend
    restart: always
    env_file:
      - ./backend/.env
    networks:
      - heds-network
    expose:
      - "3000"
    depends_on:
      - redis
      - postgres

  postgres:
    image: postgres:15-alpine
    container_name: heds-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - heds-network
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: heds-redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - heds-network

  nginx:
    image: nginx:stable-alpine
    container_name: heds-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-enabled:/etc/nginx/sites-enabled:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - heds-network

volumes:
  postgres_data:
  redis_data:

networks:
  heds-network:
    driver: bridge
```

### 12.3 Configuration Nginx

```nginx
# nginx/sites-enabled/hedsvs.ch.conf
server {
    listen 80;
    server_name hedsvs.ch www.hedsvs.ch;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hedsvs.ch www.hedsvs.ch;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/hedsvs.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hedsvs.ch/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (SPA)
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SPA fallback
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://frontend:80;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

---

## 13. CI/CD avec GitHub Actions

### 13.1 Workflow de Déploiement Automatisé

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/heds-platform
            git pull origin main
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker system prune -f
      
      - name: Health Check
        run: |
          sleep 30
          curl -f https://hedsvs.ch/health || exit 1
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 13.2 Notifications et Monitoring

```yaml
# .github/workflows/monitoring.yml
name: Health Check and Monitoring

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Application Health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://hedsvs.ch/health)
          if [ $response -ne 200 ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
      
      - name: Check Database Connection
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://hedsvs.ch/api/health/db)
          if [ $response -ne 200 ]; then
            echo "Database health check failed"
            exit 1
          fi
      
      - name: Notify on Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Application health check failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 14. Stockage et Gestion des Médias

### 14.1 Stratégie de Stockage Optimale

Pour optimiser les coûts et les performances, une approche hybride est recommandée :

**Option 1 : Stockage VPS + CDN**
- **Stockage local** : Images sur le VPS avec Nginx
- **CDN** : Cloudflare pour la distribution globale
- **Backup** : Synchronisation automatique vers cloud

**Option 2 : S3-Compatible + CDN**
- **Stockage** : MinIO ou AWS S3
- **CDN** : CloudFront ou Cloudflare
- **Optimisation** : Compression et formats modernes

### 14.2 Configuration Stockage VPS

```bash
# Structure de stockage sur VPS
/opt/heds-storage/
├── images/
│   ├── avatars/
│   ├── posts/
│   ├── institutions/
│   └── events/
├── documents/
│   ├── notes/
│   ├── reports/
│   └── certificates/
└── backups/
    ├── daily/
    ├── weekly/
    └── monthly/
```

```nginx
# Configuration Nginx pour les médias
location /storage/ {
    alias /opt/heds-storage/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # Optimisation images
    location ~* \.(jpg|jpeg|png|gif)$ {
        add_header Vary Accept;
        try_files $uri @webp;
    }
    
    location @webp {
        add_header Vary Accept;
        try_files ${uri}.webp $uri;
    }
}
```

### 14.3 Service de Gestion des Médias

```javascript
// services/mediaService.js
export class MediaService {
  constructor() {
    this.baseUrl = '/storage'
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  }

  async uploadFile(file, category = 'general') {
    // Validation
    if (!this.validateFile(file)) {
      throw new Error('Fichier non valide')
    }

    // Compression si image
    const processedFile = await this.processImage(file)
    
    // Upload
    const formData = new FormData()
    formData.append('file', processedFile)
    formData.append('category', category)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    })

    if (!response.ok) {
      throw new Error('Erreur upload')
    }

    return response.json()
  }

  async processImage(file) {
    if (!file.type.startsWith('image/')) return file

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Redimensionnement
        const maxWidth = 1920
        const maxHeight = 1080
        
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  validateFile(file) {
    return this.allowedTypes.includes(file.type) && 
           file.size <= this.maxFileSize
  }

  getOptimizedUrl(url, options = {}) {
    const { width, height, quality = 85, format = 'webp' } = options
    
    if (!width && !height) return url
    
    const params = new URLSearchParams()
    if (width) params.set('w', width)
    if (height) params.set('h', height)
    params.set('q', quality)
    params.set('f', format)
    
    return `${url}?${params.toString()}`
  }
}
```

---

*Documentation technique complète - Partie 2/2*
*Mise à jour : 30 janvier 2025*
