const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { createCanvas } = require("canvas");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();
const db = require('./db'); // Koneksi PostgreSQL

const ownerNumber = "6287851745422"; // Nomor Owner
const prefix = "!";
const sessionFolder = "auth"; // Folder penyimpanan session
let premiumUsers = {}; // Penyimpanan user premium
let bannedUsers = {}; // Penyimpanan user yang dibanned
let userCoins = {}; // Penyimpanan koin user
let gameSessions = {}; // Penyimpanan sesi game
let airdropEnabled = true; // Status airdrop

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
📜 *ZX BOT MENU* 📜
👑 _BOT MADE BY: Zyraxyro_

🛠 *Command Dasar*  
⚡ !ping  
🎵 !ytmp3 [link]  
📹 !ytmp4 [link]  
📢 !tagall  

🎨 *Sticker & AI*  
🖼 !sticker (Reply gambar)  
✏️ !brats [teks]  
🤖 !chat [GPT]  
🖌 !ai [GPT]  

🏆 *Fitur Grup*  
🚪 !kick @user  
➕ !add [nomor]  
📢 !tagall  

🎮 *Game Seru*  
🎲 !game  
💰 !steal @user  

💸 *Ekonomi*  
🎁 !airdrop  
🏦 !me (Cek profil)  
💳 !profile @user  

💎 *Premium*  
🛠 !addprem @user [tanggal bulan tahun]  
🚀 !premmenu (Fitur premium)  

🔧 *Owner Only*  
🖥 !ownermenu  
                `;
                await sock.sendMessage(message.key.remoteJid, { text: menuText }, { quoted: message });
            }

            // PING
            if (text === "!ping") {
                await sock.sendMessage(message.key.remoteJid, { text: "🏓 Pong!" }, { quoted: message });
            }

            // KICK USER
            if (text.startsWith("!kick") && isGroup) {
                let mention = text.split(" ")[1] + "@s.whatsapp.net";
                await sock.groupParticipantsUpdate(message.key.remoteJid, [mention], "remove");
                await sock.sendMessage(message.key.remoteJid, { text: `✅ @${mention} telah dikeluarkan!` }, { mentions: [mention] });
            }

            // STICKER MAKER
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

            // TOGGLE AIRDROP
            if (text === "!airdrop") {
                airdropEnabled = !airdropEnabled;
                const status = airdropEnabled ? "✅ Airdrop AKTIF!" : "❌ Airdrop NONAKTIF!";
                await sock.sendMessage(message.key.remoteJid, { text: `Airdrop status: ${status}` });
            }

            // CLAIM AIRDROP
            if (text === "!open") {
                if (!airdropEnabled) return;
                const isZonk = Math.random() < Math.random();
                let reward = isZonk ? "💀 ZONK! Coba lagi lain kali." : `🎁 Selamat! Kamu mendapatkan $${Math.floor(Math.random() * 100) + 1}`;
                await sock.sendMessage(message.key.remoteJid, { text: `@${sender.split('@')[0]} ${reward}` }, { mentions: [sender] });
            }

        } catch (err) {
            console.error("❌ ERROR:", err);
        }
    });
}

startBot();
