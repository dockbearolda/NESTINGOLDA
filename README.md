# Dasholda Atelier

## Lancement local

1. Copier `.env.example` vers `.env`
2. Renseigner `APP_PASSWORD` et `SESSION_SECRET`
3. Lancer:

```bash
npm start
```

Application:

```text
http://127.0.0.1:3000
```

## Variables Railway

- `PORT`: injecte automatiquement par Railway
- `HOST`: `0.0.0.0`
- `APP_PASSWORD`: mot de passe d'acces a l'application
- `SESSION_SECRET`: cle secrete longue pour signer la session

## Healthcheck

```text
/healthz
```
