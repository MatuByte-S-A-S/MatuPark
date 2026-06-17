#!/usr/bin/env python3
import os, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(os.environ.get("DEPLOY_HOST","13.140.160.248"), username="root", password=os.environ["SSH_PASS"], timeout=30)

def run(cmd):
    print(">>>", cmd)
    _,o,e=c.exec_command(cmd, timeout=60)
    out=o.read().decode(); err=e.read().decode()
    if out: print(out)
    if err: print("ERR:", err)

run("cat /root/apps/pay/config/apps/matupark.yaml")
run("curl -sS http://127.0.0.1:3020/health")
run("curl -sS -H 'Host: pay.matubyte.com' http://127.0.0.1/health")
run("curl -sS https://127.0.0.1/health -H 'Host: pay.matubyte.com' --insecure")
run("pm2 logs paymatubyte --lines 30 --nostream")
run("ls /etc/nginx/sites-enabled/")
c.close()
