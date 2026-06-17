#!/usr/bin/env python3
"""Sube start-billing.mjs y reinicia PM2."""
import os
import sys
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
PASSWORD = os.environ.get("SSH_PASS", "")
APP_DIR = "/root/apps/MatuPark"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def run(client, cmd):
    print(f"\n>>> {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print("STDERR:", err.rstrip())


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD, timeout=30)

sftp = client.open_sftp()
sftp.put("server/start-billing.mjs", f"{APP_DIR}/server/start-billing.mjs")
sftp.put("ecosystem.config.cjs", f"{APP_DIR}/ecosystem.config.cjs")
sftp.close()

run(client, f"cd {APP_DIR} && pm2 delete matupark-billing 2>/dev/null || true")
run(client, f"cd {APP_DIR} && pm2 start ecosystem.config.cjs")
run(client, "pm2 save")
run(client, "sleep 2 && curl -sS -m 10 http://127.0.0.1:3010/api/billing/plans")
run(client, "curl -sS -m 10 -H 'Host: matupark.matubyte.com' http://127.0.0.1/api/billing/plans")
client.close()
print("\n✓ billing API OK")
