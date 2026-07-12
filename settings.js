const settings = {
  packname: 'Daratech Bot',
  author: 'Daratech',
  botName: "Daratech Bot",
  botOwner: 'Daratech', // Your name
  ownerNumber: '2349165201363', //Set your number here without + symbol, just add country code & number without any space
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  newsApiKey: 'dcd720a6f1914e2d9dba9790c188c08c',
  weatherApiKey: '4902c0f2550f58298ad4146a92b65e10',
  commandMode: "public",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "Daratech Bot -- a WhatsApp bot for managing group commands and automating tasks.",
  version: "1.0.0",
  // .update uses `git pull` if this deployment has a git remote configured;
  // otherwise it falls back to downloading and extracting this zip.
  updateZipUrl: "https://github.com/adtelecominfo-png/daratech-bot/archive/refs/heads/main.zip",
};

module.exports = settings;
