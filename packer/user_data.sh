#!/bin/bash

echo "Running the bash script.."

sudo yum update

sudo yum upgrade

sudo amazon-linux-extras install epel -y

sudo yum install curl -y

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

source ~/.bashrc

nvm install 16

node -v

npm -v



pwd
ls -a
npm install -g npm@9.5.1
unzip webapp.zip -d webapp-main

rm webapp.zip
cd webapp-main
npm i --save
touch webapp.service
sudo cat >> webapp.service <<'EOF'
[Unit]
Description=webapp
After=multi-user.target
[Service]
EnvironmentFile=/home/ec2-user/webapp-main/.env
ExecStart=/home/ec2-user/.nvm/versions/node/v16.19.1/bin/node /home/ec2-user/webapp-main/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webapp-server-log
User=ec2-user
[Install]
WantedBy=multi-user.target
EOF
sudo mv webapp.service /lib/systemd/system/webapp.service

which node
