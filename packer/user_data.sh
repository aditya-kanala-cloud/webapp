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

echo "Starting PostgreSQL script"

sudo tee /etc/yum.repos.d/pgdg.repo<<EOF
[pgdg13]
name=PostgreSQL 13 for RHEL/CentOS 7 - x86_64
baseurl=https://download.postgresql.org/pub/repos/yum/13/redhat/rhel-7-x86_64
enabled=1
gpgcheck=0
EOF
sudo yum install postgresql13 postgresql13-server -y
sudo /usr/pgsql-13/bin/postgresql-13-setup initdb
sudo systemctl start postgresql-13
sudo systemctl enable postgresql-13



sudo yum install -y expect
pwd
sudo -u postgres psql -U postgres -d postgres -c "alter user postgres with password 'password';"
sudo -u postgres psql -U postgres -d postgres -c "create database test;"

sudo yum remove -y expect

pwd

npm install -g npm@9.5.1
unzip webapp.zip -d webapp-main

rm webapp.zip

which node
cd webapp-main
npm i --save
sudo chmod 755 ../webapp-main
sudo cat >> ~/.bashrc <<'EOF'
export DB_HOST="127.0.0.1"
export DB_USER="postgres"
export DB_PASS="password"
export DB_DATABASE="test"
export DB_DIALECT="postgres"
export test_phrase="Variables Imported from Bashrc file....."
export SERVER_PORT="3000"
export TZ="America/New_York"
EOF
source ~/.bashrc
touch envVari
sudo cat >> envVari <<'EOF'
DB_HOST="127.0.0.1"
DB_USER="postgres"
DB_PASS="password"
DB_DATABASE="test"
DB_DIALECT="postgres"
test_phrase="Variables Imported from Bashrc file....."
SERVER_PORT="3000"
TZ="America/New_York"
EOF
touch webapp.service

sudo cat >> webapp.service <<'EOF'
[Unit]
Description=webapp
After=multi-user.target

[Service]
EnvironmentFile=/home/ec2-user/webapp-main/envVari
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

sudo systemctl daemon-reload

sudo systemctl start webapp
sudo systemctl enable webapp

sudo systemctl status webapp