#!/usr/bin/env python3
"""Despliegue remoto MatuPark vía SSH. Uso: SSH_PASS=... python scripts/remote-deploy.py"""
import os
import sys
import tarfile
import tempfile
import io
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("SSH_PASS", "")
APP_DIR = "/root/apps/MatuPark"
PAY_DIR = "/root/apps/pay"
ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {
    "node_modules",
    ".git",
    "dist",
    ".cursor",
    "agent-transcripts",
}
SKIP_FILES = {".env"}

if not PASSWORD:
    print("ERROR: define SSH_PASS", file=sys.stderr)
    sys.exit(1)

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def run(client, cmd, timeout=900):
    print(f"\n>>> {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print("STDERR:", err.rstrip())
    if code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd}")
    return out


def should_skip(rel: Path) -> bool:
    parts = rel.parts
    if parts and parts[0] in SKIP_DIRS:
        return True
    if rel.name in SKIP_FILES:
        return True
    return False


def build_tarball() -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for path in ROOT.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(ROOT)
            if should_skip(rel):
                continue
            tar.add(path, arcname=str(rel).replace("\\", "/"))
    buf.seek(0)
    return buf.read()


def production_env() -> str:
    local_env = ROOT / ".env"
    values = {}
    if local_env.exists():
        for line in local_env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            values[key.strip()] = val.strip()

    values["VITE_APP_URL"] = "https://matupark.matubyte.com"
    values["PAYMATUBYTE_URL"] = "https://pay.matubyte.com"
    values.pop("PAYMATUBYTE_HOST", None)
    values["BILLING_API_PORT"] = "3010"
    values.setdefault("NODE_ENV", "production")

    order = [
        "VITE_MATUDB_URL",
        "VITE_MATUDB_PROJECT_ID",
        "VITE_MATUDB_API_KEY",
        "VITE_APP_URL",
        "PAYMATUBYTE_URL",
        "PAYMATUBYTE_API_KEY",
        "BILLING_API_PORT",
        "SIGNUP_SECRET",
    ]
    lines = []
    for key in order:
        if key in values and values[key]:
            lines.append(f"{key}={values[key]}")
    for key, val in sorted(values.items()):
        if key in order or key == "NODE_ENV":
            continue
        if val:
            lines.append(f"{key}={val}")
    return "\n".join(lines) + "\n"


def upload_paymatupark_yaml(sftp):
    yaml_path = ROOT.parent / "PayMatuByte" / "config" / "apps" / "matupark.yaml"
    if not yaml_path.exists():
        print("⚠ matupark.yaml no encontrado en PayMatuByte — omitiendo")
        return
    remote = f"{PAY_DIR}/config/apps/matupark.yaml"
    sftp.put(str(yaml_path), remote)
    print(f"✓ Subido {remote}")


def main():
    print(f"→ Empaquetando {ROOT} …")
    tarball = build_tarball()
    print(f"→ Tamaño tarball: {len(tarball) / 1024 / 1024:.1f} MB")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(client, f"mkdir -p {APP_DIR}")

    sftp = client.open_sftp()
    remote_tar = f"{APP_DIR}/deploy-upload.tar.gz"
    with sftp.file(remote_tar, "wb") as f:
        f.write(tarball)
    print(f"✓ Subido {remote_tar}")

    with sftp.file(f"{APP_DIR}/.env", "w") as f:
        f.write(production_env())
    print("✓ .env producción subido")

    upload_paymatupark_yaml(sftp)
    sftp.close()

    run(client, f"cd {APP_DIR} && tar -xzf deploy-upload.tar.gz && rm deploy-upload.tar.gz")
    run(client, f"cd {APP_DIR} && sed -i 's/\\r$//' deploy/*.sh deploy/nginx/*.conf 2>/dev/null || true")
    run(client, f"cd {APP_DIR} && chmod +x deploy/*.sh")
    run(client, f"cd {APP_DIR} && bash deploy/deploy.sh", timeout=1200)

    # Nginx: pay en HTTP si aún no hay SSL (evita nginx -t fallido)
    ssl_pay = run(
        client,
        "test -f /etc/letsencrypt/live/pay.matubyte.com/fullchain.pem && echo PAY_SSL_OK || echo PAY_SSL_NO",
    )
    if "PAY_SSL_NO" in ssl_pay:
        run(
            client,
            "cp /root/apps/pay/deploy/nginx/pay.matubyte.com.http.conf /etc/nginx/sites-available/pay.matubyte.com",
        )
        run(
            client,
            "ln -sf /etc/nginx/sites-available/pay.matubyte.com /etc/nginx/sites-enabled/pay.matubyte.com",
        )

    run(client, f"cd {APP_DIR} && sudo bash deploy/install-nginx.sh", timeout=120)

    cert_check = run(
        client,
        "test -f /etc/letsencrypt/live/matupark.matubyte.com/fullchain.pem && echo HAS_SSL || echo NO_SSL",
    )
    if "NO_SSL" in cert_check:
        print("\n→ Solicitando certificado SSL…")
        run(client, f"cd {APP_DIR} && sudo bash deploy/setup-ssl.sh", timeout=300)

    print("\n→ Reiniciando PayMatuByte (matupark.yaml)…")
    run(client, f"cd {PAY_DIR} && pm2 restart paymatubyte --update-env || true")

    run(client, "pm2 list")
    run(client, "curl -sS -m 15 -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/api/billing/plans || true")
    run(client, "curl -sS -m 15 https://matupark.matubyte.com/ | head -c 120 || curl -sS -m 15 http://matupark.matubyte.com/ | head -c 120")

    client.close()
    print("\n✓ MatuPark desplegado en https://matupark.matubyte.com")
    print("  DNS: matupark.matubyte.com →", HOST)


if __name__ == "__main__":
    main()
