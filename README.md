# 🔐 SecureChat — E2EE Web Chat Application

Aplikasi pesan instan berbasis web dengan **End-to-End Encryption** menggunakan:
- **ECDH P-256** — Key Exchange
- **HKDF-SHA256** — Key Derivation
- **AES-GCM** (128/256-bit) — Encryption per pesan
- **Firebase Auth** — Autentikasi pengguna
- **Socket.IO** — Real-time relay server

---

## 📁 Struktur Proyek

```
secure-chat/
├── server/          # Node.js + Express + Socket.IO backend
└── client/          # Vite + React + shadcn/ui frontend
```

---

## ⚙️ Setup Firebase (WAJIB sebelum menjalankan)

### Step 1 — Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **"Add project"** → Beri nama (misal: `secure-chat-app`) → Klik Continue
3. Matikan Google Analytics (opsional) → Klik **"Create project"**

### Step 2 — Aktifkan Email/Password Auth
1. Di sidebar kiri, klik **Authentication** → Tab **Sign-in method**
2. Klik **Email/Password** → Toggle **Enable** → **Save**

### Step 3 — Dapatkan Web SDK Config (untuk Client)
1. Di Project Overview, klik ikon **`</>`** (Web app)
2. Register app dengan nama (misal: `secure-chat-client`)
3. Salin objek `firebaseConfig` yang muncul
4. Buka `client/src/lib/firebase.js` dan **ganti** nilai-nilai placeholder dengan config Anda

### Step 4 — Dapatkan Service Account Key (untuk Server)
1. Klik ⚙️ **Project Settings** → Tab **Service accounts**
2. Klik **"Generate new private key"** → Konfirmasi
3. File JSON akan ter-download — **RENAME** menjadi `serviceAccountKey.json`
4. **PINDAHKAN** file tersebut ke folder `server/`

> ⚠️ **JANGAN** commit `serviceAccountKey.json` ke Git! File ini sudah ada di `.gitignore`.

---

## 🚀 Menjalankan Aplikasi

Buka **dua terminal** secara bersamaan:

### Terminal 1 — Backend Server
```bash
cd server
npm install
npm run dev
```
Server berjalan di: `http://localhost:3001`

### Terminal 2 — Frontend Client
```bash
cd client
npm run dev
```
App berjalan di: `http://localhost:5173`

---

## 🎬 Skenario Demo (Presentasi)

1. Buka **dua browser window** (atau gunakan Chrome + Firefox)
2. Akses `http://localhost:5173` di kedua browser
3. **Browser 1 (Alice):** Daftar/Login → Klik **"+ Join Room"** → Masukkan `demo-room` → Enter
4. **Browser 2 (Bob):** Daftar/Login → Klik **"+ Join Room"** → Masukkan `demo-room` → Enter
5. Perhatikan **animasi ECDH Handshake** di kedua browser
6. Buka **Crypto Log** (klik tombol "Crypto Log" di header) di kedua browser
7. Kirim pesan dari Alice → Lihat **ciphertext** di Crypto Log → Lihat **plaintext** di sisi Bob
8. Coba ganti AES-128 ↔ AES-256 menggunakan dropdown di input field
9. (Opsional) Buka **DevTools → Network → WS** → Inspeksi payload WebSocket

---

## 🔒 Arsitektur Keamanan

```
Alice (Browser)          Relay Server          Bob (Browser)
────────────────         ─────────────         ───────────────
Generate ECDH            Verify Token          Generate ECDH
Key Pair (P-256)    →   Join Room         ←   Key Pair (P-256)
                         ↓
Send Public Key A   →   Relay (no store)  →   Receive Key A
Receive Key B       ←   Relay (no store)  ←   Send Public Key B
                         ↓
ECDH(privA, pubB)        [Server cannot       ECDH(privB, pubA)
= sharedSecret           see keys/secrets]    = sharedSecret (same!)
HKDF → AES Key                                HKDF → AES Key (same!)
                         ↓
Encrypt("Hello")    →   Relay ciphertext  →   Decrypt → "Hello"
```

---

## 🛡️ Known Limitations (Akademis)

- Tidak ada key fingerprint verification (QR code scan seperti Signal)
- PFS berlaku per-sesi, bukan per-pesan
- Trust pada relay server untuk meneruskan public key dengan benar
