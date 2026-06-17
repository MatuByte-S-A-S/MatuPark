#!/usr/bin/env python3
import os, paramiko
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(os.environ.get('DEPLOY_HOST','13.140.160.248'), username='root', password=os.environ['SSH_PASS'], timeout=30)
_,o,_=c.exec_command("grep pay.matubyte.com /etc/hosts || echo '127.0.0.1 pay.matubyte.com' >> /etc/hosts")
o.read()
_,o,_=c.exec_command("getent hosts pay.matubyte.com && curl -sS https://pay.matubyte.com/health")
print(o.read().decode())
c.close()
