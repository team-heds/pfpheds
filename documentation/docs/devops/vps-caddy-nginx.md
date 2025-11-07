---
title: "VPS: Caddy vs Nginx"
---

Ce guide décrit une configuration minimale pour servir l'app (SPA Vite) et la documentation (Docusaurus) depuis un VPS avec Caddy ou Nginx.

## Structure des artefacts

Après build complet:

```bash
npm run build:all

# Résultat
dist/
  index.html        # SPA
  assets/           # bundle app
  docs/             # site Docusaurus (index.html à l'intérieur)
```

## Caddy (v2)

`/etc/caddy/Caddyfile`

```caddy
example.com {
  root * /var/www/pfpheds/dist
  encode zstd gzip
  file_server

  # SPA fallback
  try_files {path} /index.html

  # Docs sous /docs
  handle_path /docs* {
    root * /var/www/pfpheds/dist/docs
    file_server
    try_files {path} /index.html
  }
}
```

Recharger Caddy:

```bash
sudo systemctl reload caddy
```

## Nginx

`/etc/nginx/sites-available/pfpheds`

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/pfpheds/dist;
  index index.html;

  # App (SPA)
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Docs
  location /docs/ {
    alias /var/www/pfpheds/dist/docs/;
    try_files $uri $uri/ /docs/index.html;
  }
}
```

Activer le site et recharger Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/pfpheds /etc/nginx/sites-enabled/pfpheds
sudo nginx -t && sudo systemctl reload nginx
```

## Déploiement

- Copier le contenu de `dist/` sur le VPS (rsync/FTP/CI):

```bash
rsync -avz dist/ user@server:/var/www/pfpheds/dist/
```

## Notes

- Assurez-vous que les permissions du répertoire `/var/www/pfpheds/dist` sont correctes.
- Si vous utilisez HTTPS, configurez Caddy/Nginx (Let’s Encrypt) selon vos besoins.
