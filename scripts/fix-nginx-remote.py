#!/usr/bin/env python3
"""Reparar nginx en VPS tras deploy MatuPark."""
import os
import sys
import paramiko

HOST = os.environ.get("DEPLOY_HOST", "13.140.160.248")
PASSWORD = os.environ.get("SSH_PASS", "")


def run(client, cmd, timeout=120):
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


def main():
    if not PASSWORD:
        print("ERROR: SSH_PASS required", file=sys.stderr)
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=PASSWORD, timeout=30)

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

    run(
        client,
        "cp /root/apps/MatuPark/deploy/nginx/matupark.matubyte.com.http.conf /etc/nginx/sites-available/matupark.matubyte.com",
    )
    run(
        client,
        "ln -sf /etc/nginx/sites-available/matupark.matubyte.com /etc/nginx/sites-enabled/matupark.matubyte.com",
    )

    run(client, "nginx -t")
    run(client, "systemctl reload nginx")

    run(client, "curl -sS -m 10 http://127.0.0.1:3010/api/billing/plans | head -c 300")
    run(client, "curl -sS -m 10 -H 'Host: matupark.matubyte.com' http://127.0.0.1/ | head -c 200")
    run(client, "cd /root/apps/pay && pm2 restart paymatubyte --update-env")

    ssl_mp = run(
        client,
        "test -f /etc/letsencrypt/live/matupark.matubyte.com/fullchain.pem && echo HAS_SSL || echo NO_SSL",
    )
    if "NO_SSL" in ssl_mp:
        print("\n→ Intentando SSL matupark.matubyte.com …")
        try:
            run(client, "cd /root/apps/MatuPark && bash deploy/setup-ssl.sh", timeout=300)
        except RuntimeError as e:
            print(f"⚠ SSL matupark: {e}")

    run(
        client,
        "curl -sS -m 15 https://matupark.matubyte.com/ 2>/dev/null | head -c 150 || curl -sS -m 15 -H 'Host: matupark.matubyte.com' http://127.0.0.1/ | head -c 150",
    )
    run(
        client,
        "curl -sS -m 15 https://pay.matubyte.com/health 2>/dev/null | head -c 200 || curl -sS -m 15 http://pay.matubyte.com/health | head -c 200",
    )

    client.close()
    print("\n✓ Nginx reparado")


if __name__ == "__main__":
    main()
