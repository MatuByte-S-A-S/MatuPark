#!/usr/bin/env python3
"""SSL + nginx HTTPS para pay.matubyte.com."""
import os
import sys
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
PASSWORD = os.environ.get("SSH_PASS", "")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def run(client, cmd, timeout=300):
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

ssl = run(
    client,
    "test -f /etc/letsencrypt/live/pay.matubyte.com/fullchain.pem && echo HAS_SSL || echo NO_SSL",
)
if "NO_SSL" in ssl:
    run(client, "cd /root/apps/pay && sudo bash deploy/setup-ssl.sh", timeout=300)
else:
    run(client, "cd /root/apps/pay && sudo bash deploy/install-nginx.sh")

run(client, "curl -sS -m 15 https://pay.matubyte.com/health")
run(client, "curl -sS -m 15 'https://pay.matubyte.com/v1/pay/return/matupark?reference=test'")
client.close()
print("\n✓ pay.matubyte.com HTTPS OK")
