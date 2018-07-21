clear
sudo kill $(sudo lsof -t -i:3000)
node server_chat.js
