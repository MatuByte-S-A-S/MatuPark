#!/usr/bin/env python3
"""Corregir hosts, matupark.yaml y rebuild PayMatuByte."""
import os
import sys
from pathlib import Path
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
PASSWORD = os.environ.get("SSH_PASS", "")
PAY_DIR = "/root/apps/pay"
PAY_ROOT = Path(__file__).resolve().parent.parent.parent / "PayMatuByte"
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
        raise RuntimeError(f"Failed ({code}): {cmd}")
    return out


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD, timeout=30)

# Quitar entrada obsoleta en /etc/hosts (83.x)
run(client, "grep -n pay.matubyte.com /etc/hosts || true")
run(
    client,
    "sed -i '/pay\\.matubyte\\.com/d' /etc/hosts && grep pay.matubyte.com /etc/hosts || echo 'hosts limpio'",
)

sftp = client.open_sftp()
files = [
    ("config/apps/matupark.yaml", f"{PAY_DIR}/config/apps/matupark.yaml"),
    (
        "src/modules/payments/payment-link.service.ts",
        f"{PAY_DIR}/src/modules/payments/payment-link.service.ts",
    ),
    (
        "src/repositories/payment.repository.ts",
        f"{PAY_DIR}/src/repositories/payment.repository.ts",
    ),
]
for local_rel, remote in files:
    local = PAY_ROOT / local_rel
    if local.exists():
        sftp.put(str(local), remote)
        print(f"✓ {remote}")
sftp.close()

run(client, f"cd {PAY_DIR} && npm run build", timeout=600)
run(client, f"cd {PAY_DIR} && pm2 restart paymatubyte --update-env")
run(client, "curl -sS https://pay.matubyte.com/health")
run(
    client,
    "curl -sS 'https://pay.matubyte.com/v1/pay/return/matupark?reference=test'",
)
client.close()
print("\n✓ PayMatuByte actualizado")
