const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { createCanvas } = require("canvas");
const fs = require("fs");
require("dotenv").config();

const ownerNumber = "6287851745422"; // Nomor Owner
const prefix = "!";
const sessionFolder = "auth"; // Folder penyimpanan session
let premiumUsers = {}; // Penyimpanan user premium
let bannedUsers = {}; // Penyimpanan user yang dibanned
let userCoins = {}; // Penyimpanan koin pemain

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        if (update.connection === "open") {
            console.log("✅ ZX BOT berhasil terhubung!");
        }
    });

    sock.ev.on("messages.upsert", async (msg) => {
        try {
            const message = msg.messages[0];
            if (!message.message) return;

            const isGroup = message.key.remoteJid.endsWith("@g.us");
            const sender = isGroup ? message.key.participant : message.key.remoteJid;
            const text = message.message.conversation || message.message.extendedTextMessage?.text || "";
            const replyMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;

            console.log(`📩 ${isGroup ? "Grup" : "Private"} | ${text}`);

            if (bannedUsers[sender]) return; // Cegah user yang dibanned mengirim pesan

            // MENU
            if (text === "!menu") {
                const menuText = `
╭─── *🤖 ZX BOT MENU 🤖* ───╮
│ 🤖 *BOT BY: Zyraxyro (mereng)*
│ 🔗 https://whatsapp.com/channel/0029Vb0tQkoKgsO2XYyXJc0s
│  
│ 🛠 *Command Dasar*  
│ ⚡ !ping  
│ 👑 !owner  
│ 🎵 !ytmp3 [link]  
│ 📹 !ytmp4 [link]  
│  
│ 🎨 *Sticker & AI*  
│ 🖼 !sticker (Reply gambar)  
│ ✏️ !brats [teks] (Teks jadi stiker)  
│ 🤖 !chat [GPT]  
│ 🖌 !ai [GPT] (Gambar AI)  
│  
│ 🏆 *Fitur Grup*  
│ 🚪 !kick @user (Admin)  
│ ➕ !add [nomor] (Admin)  
│ 📢 !tagall (Tag semua anggota)  
│  
│ 🎮 *Game Seru*  
│ 🎲 !game (10 permainan)  
│  
╰── More info about ZX BOT: https://whatsapp.com/channel/0029Vb0tQkoKgsO2XYyXJc0s
                `;
                await sock.sendMessage(message.key.remoteJid, { text: menuText }, { quoted: message });
            }

            // PING
            if (text === "!ping") {
                await sock.sendMessage(message.key.remoteJid, { text: "🏓 Pong!" }, { quoted: message });
            }

            // OWNER INFO
            if (text === "!owner") {
                await sock.sendMessage(message.key.remoteJid, { text: `👤 Owner: wa.me/${ownerNumber}` }, { quoted: message });
            }

            // STICKER (Harus Reply Gambar)
            if (text === "!sticker") {
                if (!replyMessage?.imageMessage) {
                    return sock.sendMessage(message.key.remoteJid, { text: "⚠️ Tolong balas satu foto!" }, { quoted: message });
                }

                const stream = await downloadContentFromMessage(replyMessage.imageMessage, "image");
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                await sock.sendMessage(message.key.remoteJid, { sticker: buffer }, { quoted: message });
            }

            // TAGALL
            if (text === "!tagall" && isGroup) {
                const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
                const participants = groupMetadata.participants.map(p => `@${p.id.split("@")[0]}`).join("\n");
                await sock.sendMessage(message.key.remoteJid, { text: `📢 Hi everyone, admin tagged you @${sender}\n\n${participants}`, mentions: groupMetadata.participants.map(p => p.id) }, { quoted: message });
            }

            // BAN USER
            if (text.startsWith("!ban") && sender.includes(ownerNumber)) {
                let target = text.split(" ")[1] + "@s.whatsapp.net";
                bannedUsers[target] = true;
                await sock.sendMessage(message.key.remoteJid, { text: `✅ Pengguna ${target} telah dibanned!` });
            }

            // UNBAN USER
            if (text.startsWith("!unban") && sender.includes(ownerNumber)) {
                let target = text.split(" ")[1] + "@s.whatsapp.net";
                delete bannedUsers[target];
                await sock.sendMessage(message.key.remoteJid, { text: `✅ Pengguna ${target} telah di-unban!` });
            }

            // ADD PREMIUM
            if (text.startsWith("!addprem") && sender.includes(ownerNumber)) {
                let [_, mention, tanggal] = text.split(" ");
                premiumUsers[mention] = tanggal;
                await sock.sendMessage(message.key.remoteJid, { text: `✅ Sukses menambahkan ${mention} sebagai user premium hingga ${tanggal}!` });
            }

        } catch (err) {
            console.error("❌ ERROR:", err);
        }
    });
}

startBot();