const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();
const db = require("./db"); // Koneksi PostgreSQL

const ownerNumber = process.env.OWNER_NUMBER || "6287851745422";
const prefix = "!";
const sessionFolder = "auth";
let airdropEnabled = true;
let gameSessions = {};
const randomWords = ["kucing", "hujan", "komputer", "sepeda", "langit"];
const mathQuestions = [
    { question: "7 + 5 = ?", answer: "12" },
    { question: "9 - 3 = ?", answer: "6" },
    { question: "4 x 2 = ?", answer: "8" }
];
const cakLontongQuestions = [
    { question: "Apa yang lebih besar dari gajah?", answer: "Bayangannya" },
    { question: "Kenapa pintu harus dikunci?", answer: "Karena kalau dikancing malah aneh" }
];

async function startBot() {
    try {
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder);
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        const sock = makeWASocket({ auth: state, printQRInTerminal: true });

        sock.ev.on("creds.update", saveCreds);
        sock.ev.on("connection.update", (update) => {
            if (update.connection === "open") {
                console.log("✅ ZX BOT berhasil terhubung!");
            } else if (update.connection === "close") {
                console.log("❌ Koneksi terputus. Bot akan mencoba menyambung kembali...");
                setTimeout(startBot, 5000);
            }
        });

        sock.ev.on("messages.upsert", async (msg) => {
            try {
                const message = msg.messages[0];
                if (!message.message) return;
                
                const isGroup = message.key.remoteJid.endsWith("@g.us");
                const sender = isGroup ? message.key.participant : message.key.remoteJid;
                const text = message.message.conversation || message.message.extendedTextMessage?.text || "";

                console.log(`📩 ${isGroup ? "Grup" : "Private"} | ${text}`);

                if (text === "!menu") {
                    const menuText = `
📜 *ZX BOT MENU* 📜
👑 _BOT MADE BY: Zyraxyro_

🛠 *Command Dasar*  
⚡ !ping  
🎵 !ytmp3 [link]  
📹 !ytmp4 [link]  
📢 !tagall  

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

                if (text === "!game") {
                    let gameList = "🎮 *Game by ZX BOT* 🎮\n\n";
                    const newGames = [
                        "!tebakangka - Tebak angka dari 1-10.",
                        "!tebakkata - Tebak kata acak.",
                        "!suit [batu/kertas/gunting] - Main suit dengan bot.",
                        "!mathquiz - Jawab soal matematika acak.",
                        "!caklontong - Tebak jawaban dari pertanyaan ala Cak Lontong."
                    ];
                    newGames.forEach((game) => {
                        gameList += `🔥 ${game}\n`;
                    });
                    gameList += "\nGunakan perintah sesuai game untuk bermain!";
                    await sock.sendMessage(message.key.remoteJid, { text: gameList });
                }
                
                if (!gameSessions[sender]) {
                    gameSessions[sender] = { plays: 0, lastPlayed: Date.now() };
                }
                let session = gameSessions[sender];
                let now = Date.now();
                if (now - session.lastPlayed > 24 * 60 * 60 * 1000) {
                    gameSessions[sender] = { plays: 0, lastPlayed: now };
                    session = gameSessions[sender];
                }
                if (session.plays >= 10) {
                    await sock.sendMessage(message.key.remoteJid, { text: "❌ Kamu sudah bermain 10 kali hari ini!" });
                    return;
                }
                
                if (text === "!tebakangka") {
                    const number = Math.floor(Math.random() * 10) + 1;
                    gameSessions[sender] = { answer: number.toString() };
                    await sock.sendMessage(message.key.remoteJid, { text: "🎯 Tebak angka dari 1-10!" });
                }
                if (gameSessions[sender]?.answer && text === gameSessions[sender].answer) {
                    await sock.sendMessage(message.key.remoteJid, { text: "✅ Benar! Kamu menebak angka dengan tepat." });
                    delete gameSessions[sender];
                }
                
                if (text === "!tebakkata") {
                    const word = randomWords[Math.floor(Math.random() * randomWords.length)];
                    gameSessions[sender] = { answer: word };
                    await sock.sendMessage(message.key.remoteJid, { text: `🔠 Tebak kata: ${word.replace(/[a-zA-Z]/g, '_')}` });
                }
                if (gameSessions[sender]?.answer && text.toLowerCase() === gameSessions[sender].answer) {
                    await sock.sendMessage(message.key.remoteJid, { text: "✅ Benar! Kata yang dicari adalah " + gameSessions[sender].answer });
                    delete gameSessions[sender];
                }
                
                if (text.startsWith("!suit")) {
                    const choices = ["batu", "gunting", "kertas"];
                    const botChoice = choices[Math.floor(Math.random() * 3)];
                    const userChoice = text.split(" ")[1];
                    if (!choices.includes(userChoice)) {
                        await sock.sendMessage(message.key.remoteJid, { text: "❌ Pilih batu, gunting, atau kertas!" });
                        return;
                    }
                    let result = "🤝 Seri!";
                    if ((userChoice === "batu" && botChoice === "gunting") ||
                        (userChoice === "gunting" && botChoice === "kertas") ||
                        (userChoice === "kertas" && botChoice === "batu")) {
                        result = "🎉 Kamu menang!";
                    } else if (userChoice !== botChoice) {
                        result = "😢 Kamu kalah!";
                    }
                    await sock.sendMessage(message.key.remoteJid, { text: `🤖 Bot memilih *${botChoice}*\n${result}` });
                }

                if (text === "!mathquiz") {
                    const question = mathQuestions[Math.floor(Math.random() * mathQuestions.length)];
                    gameSessions[sender] = { answer: question.answer };
                    await sock.sendMessage(message.key.remoteJid, { text: `🧮 ${question.question}` });
                }
                if (gameSessions[sender]?.answer && text === gameSessions[sender].answer) {
                    await sock.sendMessage(message.key.remoteJid, { text: "🎉 Benar! Jawabanmu tepat." });
                    delete gameSessions[sender];
                }
                
                if (text === "!caklontong") {
                    const question = cakLontongQuestions[Math.floor(Math.random() * cakLontongQuestions.length)];
                    gameSessions[sender] = { answer: question.answer };
                    await sock.sendMessage(message.key.remoteJid, { text: `🤔 ${question.question}` });
                }
                if (gameSessions[sender]?.answer && text.toLowerCase() === gameSessions[sender].answer.toLowerCase()) {
                    await sock.sendMessage(message.key.remoteJid, { text: "🎉 Benar! Jawaban Cak Lontong memang aneh!" });
                    delete gameSessions[sender];
                }
                
                if (text === "!tebakgambar") {
                    await sock.sendMessage(message.key.remoteJid, { image: { url: "https://source.unsplash.com/300x200/?animal" }, caption: "📷 Tebak gambar ini!" });
                }
                
                if (text === "!tebakbendera") {
                    await sock.sendMessage(message.key.remoteJid, { image: { url: "https://flagcdn.com/w320/fr.png" }, caption: "🇫🇷 Negara apa ini?" });
                }
                
                const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");


                if (text.startsWith("!tictactoe")) {
                    const players = text.split(" ").slice(1);
                    if (players.length !== 2) {
                        await sock.sendMessage(message.key.remoteJid, { text: "❌ Gunakan format: !tictactoe @user1 @user2" });
                        return;
                    }
                    const board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
                    const firstPlayer = Math.random() < 0.5 ? players[0] : players[1];
                    const secondPlayer = firstPlayer === players[0] ? players[1] : players[0];
                    gameSessions[message.key.remoteJid] = { board, players: { [firstPlayer]: "⭕", [secondPlayer]: "❌" }, turn: firstPlayer, moves: 0 };
                    await sock.sendMessage(message.key.remoteJid, { text: `🎮 Tic Tac Toe dimulai!\nGiliran: ${firstPlayer}\n${renderBoard(board)}` });
                }
                if (text.match(/^\d$/) && gameSessions[message.key.remoteJid]) {
                    const session = gameSessions[message.key.remoteJid];
                    const move = parseInt(text) - 1;
                    if (session.board[move] === "⭕" || session.board[move] === "❌") {
                        await sock.sendMessage(message.key.remoteJid, { text: "❌ Kotak sudah terisi! Pilih angka lain." });
                        return;
                    }
                    session.board[move] = session.players[session.turn];
                    session.moves++;
                    if (checkWinner(session.board)) {
                        const reward = Math.floor(Math.random() * 101) + 200;
                        await sock.sendMessage(message.key.remoteJid, { text: `🎉 ${session.turn} menang! Hadiah: $${reward}` });
                        delete gameSessions[message.key.remoteJid];
                        return;
                    }
                    if (session.moves >= 9) {
                        await sock.sendMessage(message.key.remoteJid, { text: "🤝 Seri! Tidak ada pemenang." });
                        delete gameSessions[message.key.remoteJid];
                        return;
                    }
                    session.turn = session.turn === Object.keys(session.players)[0] ? Object.keys(session.players)[1] : Object.keys(session.players)[0];
                    await sock.sendMessage(message.key.remoteJid, { text: `Giliran: ${session.turn}\n${renderBoard(session.board)}` });
                }
                
                if (text === "!tebakkalimat") {
                    gameSessions[sender] = { answer: "sekolah" };
                    await sock.sendMessage(message.key.remoteJid, { text: "🔠 Tebak kalimat: Aku pergi ke _ _ _ _ _" });
                }
                if (gameSessions[sender]?.answer && text.toLowerCase() === gameSessions[sender].answer) {
                    await sock.sendMessage(message.key.remoteJid, { text: "🎉 Benar!" });
                    delete gameSessions[sender];
                }
                
                if (text === "!siapacepat") {
                    gameSessions[sender] = { answer: "11" };
                    await sock.sendMessage(message.key.remoteJid, { text: "⏳ Pertanyaan: Berapa hasil dari 8 + 3?" });
                }
                if (gameSessions[sender]?.answer && text === gameSessions[sender].answer) {
                    await sock.sendMessage(message.key.remoteJid, { text: "🏆 Selamat! Kamu yang menjawab tercepat!" });
                    delete gameSessions[sender];
                }

                if (text === "!random") {
                    const randomMenu = `
🎲 *Random Check* 🎲
✨ !cekcinta @user
✨ !cekganteng @user
✨ !cekcantik @user
✨ !cekjodoh @user
✨ !cekmiskin @user
✨ !cekpintar @user
✨ !ceksetia @user
✨ !cekdewasa @user
✨ !cekimut @user
✨ !cekseram @user
                    `;
                    await sock.sendMessage(message.key.remoteJid, { text: randomMenu }, { quoted: message });
                }
                
                if (text.startsWith("!cek")) {
                    const target = text.split(" ")[1] || "kamu";
                    const randomPercentage = Math.floor(Math.random() * 101);
                    const checkType = text.replace("!cek", "").trim();
                    const checkResponses = {
                        cinta: "❤️ Tingkat cintamu:",
                        ganteng: "😎 Tingkat kegantengan:",
                        cantik: "💃 Tingkat kecantikan:",
                        jodoh: "💑 Kecocokan jodoh:",
                        miskin: "💰 Tingkat kemiskinan:",
                        pintar: "🧠 Tingkat kepintaran:",
                        setia: "💞 Tingkat kesetiaan:",
                        dewasa: "🎓 Tingkat kedewasaan:",
                        imut: "🐣 Tingkat keimutan:",
                        seram: "👹 Tingkat keseraman:" 
                    };
                    const response = checkResponses[checkType] || "📊 Persentase:";
                    await sock.sendMessage(message.key.remoteJid, { text: `${response} ${randomPercentage}% untuk ${target}` });
                }

            } catch (err) {
                handleError(err, sock);
            }
        });
    } catch (err) {
        handleError(err);
    }
}

function renderBoard(board) {
    return `\n${board.slice(0, 3).join(" | ")}\n${board.slice(3, 6).join(" | ")}\n${board.slice(6, 9).join(" | ")}`;
}

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => board[pattern[0]] === board[pattern[1]] && board[pattern[1]] === board[pattern[2]]);
}

function handleError(err, sock) {
    console.error("❌ ERROR:", err.stack || err);
    fs.appendFileSync("error.log", `[${new Date().toISOString()}] ${err.stack || err}\n`);
    if (sock) {
        sock.sendMessage(ownerNumber + "@s.whatsapp.net", { text: `🚨 ERROR BOT:\n${err.message}` }).catch(() => {});
    }
}

startBot();
