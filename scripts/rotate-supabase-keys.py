#!/usr/bin/env python3
"""
Rotation des cles Supabase auto-hebergees (JWT_SECRET + ANON_KEY + SERVICE_ROLE_KEY).

A executer SUR LE SERVEUR. Ecrit les nouvelles valeurs dans les .env concernes
apres sauvegarde horodatee, et n'affiche que la cle anon (publique par
construction, elle est de toute facon incluse dans le bundle JS du frontend).
La cle service_role n'est jamais affichee.

Contexte : les cles precedentes ont fuite dans un depot GitHub public. Un JWT
est stateless et ne peut pas etre revoque individuellement : il faut changer le
secret de signature, ce qui invalide mecaniquement toutes les cles emises avec
l'ancien secret (et deconnecte les utilisateurs connectes).

Usage:
    sudo python3 rotate-supabase-keys.py            # simulation
    sudo python3 rotate-supabase-keys.py --apply    # ecriture reelle
"""

import base64
import hashlib
import hmac
import json
import re
import secrets
import shutil
import sys
import time

SUPABASE_ENV = "/opt/supabase/.env"
BACKEND_ENV = "/opt/pfpheds-backend/.env"
TEN_YEARS = 10 * 365 * 24 * 3600


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def mint_jwt(role: str, secret: str, issued_at: int) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "role": role,
        "iss": "supabase",
        "iat": issued_at,
        "exp": issued_at + TEN_YEARS,
    }
    signing_input = "{}.{}".format(
        b64url(json.dumps(header, separators=(",", ":")).encode()),
        b64url(json.dumps(payload, separators=(",", ":")).encode()),
    )
    signature = hmac.new(
        secret.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    return "{}.{}".format(signing_input, b64url(signature))


def set_env_var(text: str, key: str, value: str) -> tuple[str, bool]:
    """Remplace KEY=... en preservant le reste du fichier. Retourne (texte, trouve)."""
    pattern = re.compile(r"^{}=.*$".format(re.escape(key)), re.MULTILINE)
    if not pattern.search(text):
        return text, False
    return pattern.sub("{}={}".format(key, value), text), True


def fingerprint(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def main() -> int:
    apply_changes = "--apply" in sys.argv
    stamp = time.strftime("%Y%m%d-%H%M%S")
    issued_at = int(time.time())

    new_secret = secrets.token_hex(32)  # 64 caracteres
    new_anon = mint_jwt("anon", new_secret, issued_at)
    new_service = mint_jwt("service_role", new_secret, issued_at)

    print("=== Rotation des cles Supabase ===")
    print("mode              : {}".format("APPLICATION REELLE" if apply_changes else "simulation"))
    print("nouveau JWT_SECRET: {} caracteres (empreinte {})".format(len(new_secret), fingerprint(new_secret)))
    print("nouvelle ANON_KEY : empreinte {}".format(fingerprint(new_anon)))
    print("nouvelle SERVICE  : empreinte {}".format(fingerprint(new_service)))
    print()

    targets = [
        (SUPABASE_ENV, [("JWT_SECRET", new_secret), ("ANON_KEY", new_anon), ("SERVICE_ROLE_KEY", new_service)]),
        (BACKEND_ENV, [("SUPABASE_KEY", new_anon), ("SUPABASE_SERVICE_ROLE_KEY", new_service)]),
    ]

    for path, pairs in targets:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                content = handle.read()
        except FileNotFoundError:
            print("[IGNORE] {} introuvable".format(path))
            continue

        updated = content
        for key, value in pairs:
            updated, found = set_env_var(updated, key, value)
            print("  {} {} -> {}".format(path, key, "mis a jour" if found else "ABSENT (ignore)"))

        if apply_changes:
            backup = "{}.bak-{}".format(path, stamp)
            shutil.copy2(path, backup)
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(updated)
            print("  sauvegarde: {}".format(backup))
        print()

    if apply_changes:
        print("ANON_KEY (publique, a mettre dans VITE_SUPABASE_KEY du frontend) :")
        print(new_anon)
        print()
        print("Prochaine etape : cd /opt/supabase && sudo docker-compose up -d")
    else:
        print("Simulation terminee. Relancer avec --apply pour ecrire.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
