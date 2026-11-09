# Storybook HEdS

Le catalogue de composants est construit en fichiers statiques puis servi par le conteneur Caddy de production sur `ui.hedsvs.ch`.

## Construire

```bash
npm run build-storybook
```

Le résultat est généré dans `storybook-static/`.

## Déployer

1. Copier le contenu de `storybook-static/` dans `/var/www/pfpheds-storybook/` sur le VPS et dans le même chemin du conteneur `supabase-caddy-1`.
2. Ajouter le bloc [`Caddyfile`](./Caddyfile) à `/opt/supabase/reverse-proxy/Caddyfile`.
3. Valider puis recharger Caddy :

```bash
sudo docker exec supabase-caddy-1 caddy validate --config /etc/caddy/Caddyfile
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

4. Dans la zone DNS Infomaniak de `hedsvs.ch`, créer un enregistrement `A` pour `ui` vers `83.228.204.5`.
5. Vérifier `https://ui.hedsvs.ch/` après propagation et émission du certificat TLS.

Le vhost envoie `X-Robots-Tag: noindex, nofollow` pour éviter l’indexation du catalogue.
