# Deploy MatuPark — matupark.matubyte.com

## URLs

| Servicio | URL |
|----------|-----|
| App | https://matupark.matubyte.com |
| API billing (interna) | https://matupark.matubyte.com/api/billing |
| Pagos Bold (relay) | https://pay.matubyte.com/v1/pay/return/matupark |

## Arquitectura

```text
Usuario → nginx (matupark.matubyte.com)
            ├── /           → dist/ (Vue SPA)
            └── /api/billing → PM2 matupark-billing :3010

Registro / renovación → PayMatuByte → Bold → retorno a /register/pago-resultado o /premium/pago-resultado
```

## Planes y billing

| Plan | ID | Precio | Duración |
|------|-----|--------|----------|
| Mensual | `plan-mensual` | $27.000 COP | 1 mes |
| Semestral | `plan-semestral` | $145.800 COP | 6 meses (−10%) |
| Anual | `plan-anual` | $259.200 COP | 12 meses (−20%) |

Config PayMatuByte: `PayMatuByte/config/apps/matupark.yaml`

## Variables `.env` (producción)

```env
VITE_MATUDB_URL=https://db.matudb.com
VITE_MATUDB_PROJECT_ID=<uuid>
VITE_MATUDB_API_KEY=<key>
VITE_APP_URL=https://matupark.matubyte.com

PAYMATUBYTE_URL=https://pay.matubyte.com
PAYMATUBYTE_API_KEY=pk_matupark_prod_cambiar
BILLING_API_PORT=3010
```

Copia `.env.production.example` → `.env` en el servidor.

## Despliegue en el VPS

```bash
cd ~/apps/MatuPark
bash deploy/deploy.sh          # build + PM2
sudo bash deploy/install-nginx.sh
sudo bash deploy/setup-ssl.sh  # solo la primera vez
```

Desde Windows (con `SSH_PASS`):

```powershell
python scripts/remote-deploy.py
```

## PM2

| Proceso | Puerto | Script |
|---------|--------|--------|
| `matupark-billing` | 3010 | `server/start-billing.mjs` |

```bash
pm2 list
pm2 logs matupark-billing
pm2 restart matupark-billing --update-env
```

## DNS

```text
matupark.matubyte.com  →  IP del VPS
pay.matubyte.com       →  misma IP (API de pagos)
```
