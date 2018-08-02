clear
sudo kill $(sudo lsof -t -i:9000)
node server.js
