# 🤖 Daratech Bot

This is a WhatsApp bot built using the Baileys library for group management, including features like tagging all members, muting/unmuting, AFK, polls, reminders, a calculator, and many more. It's designed to help admins efficiently manage WhatsApp groups.

---

## 🚀 Steps to Deploy Bot

### Step 1: Get a pairing/session code

Use Baileys' own pairing-code or QR flow to link your WhatsApp account (see `index.js`). After pairing, a `creds.json` session file is generated — keep this private.

### Step 2: Run the bot

```bash
npm install
node index.js
```

Scan the QR code (or enter the pairing code, if using `--pairing-code`) shown in the terminal using the Linked Devices feature in WhatsApp to connect your account to the bot.

---

## ⚙️ Features

- **Tag all group members** with the `.tagall` command
- **Admin restricted usage** (only group admins can use certain commands)
- **Games** like Tic-Tac-Toe and Trivia for interactive group engagement
- **Text-to-Speech** with `.tts`
- **Sticker creation** with `.sticker`
- **Anti-link / anti-badword / anti-tag detection** for group safety
- **AFK, polls, reminders, and a calculator**
- **Warn and manage group members** with admin control

---

## 📖 About

Daratech Bot assists group admins by providing them with tools to efficiently manage large WhatsApp groups. The bot uses the Baileys library to interact with the WhatsApp Web API and supports multi-device features.

It is lightweight and can be easily customized to add more commands as needed. The bot runs in a Node.js environment and supports QR-code or pairing-code authentication to link your WhatsApp account.

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js installed on your system
- Git installed (if cloning from your own repository)

### Step-by-Step Setup

1. **Install the dependencies:**

    ```bash
    npm install
    ```

2. **Run the bot:**

    ```bash
    node index.js
    ```

3. **Scan the QR code:**

    Once the bot starts, a QR code will appear in the terminal. Scan this QR code using the Linked Devices feature in WhatsApp to connect your WhatsApp account with the bot.

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the LICENSE file for details.

---

## Credits

- [Baileys](https://github.com/adiwajshing/Baileys)

---

## ⚠️ Important Warning

**Note:** This bot is created for educational purposes only. This is NOT an official WhatsApp bot. Using this bot may lead to your WhatsApp account being banned. Use it at your own risk.

## 📝 Legal

- This project is not affiliated with, authorized, maintained, sponsored or endorsed by WhatsApp or any of its affiliates or subsidiaries.
- This is an independent and unofficial software. Use at your own risk.
- Do not spam people with this bot.
- Do not use this bot to send bulk messages or for illegal purposes.

## 📜 Copyright Notice

Copyright (c) 2026 Daratech. All rights reserved.

This project contains code from various open source projects:
- Baileys (MIT License)
- Other libraries as listed in package.json
