#!/usr/bin/env python3
import os
import sys
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
PASSWORD = os.environ.get("SSH_PASS", "")
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

run(client, "pm2 list")
run(client, "pm2 logs matupark-billing --lines 25 --nostream")
run(client, "cd /root/apps/MatuPark && pm2 restart matupark-billing --update-env")
run(client, "sleep 2 && curl -sS -m 10 http://127.0.0.1:3010/api/billing/plans")
run(client, "curl -sS -m 10 -H 'Host: matupark.matubyte.com' http://127.0.0.1/api/billing/plans")
run(client, "curl -sS -m 10 http://pay.matubyte.com/health")
run(client, "curl -sS -m 10 -H 'Host: matupark.matubyte.com' http://127.0.0.1/ | head -c 120")
client.close()
