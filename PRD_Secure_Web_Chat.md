# PRODUCT REQUIREMENTS DOCUMENT (PRD) — v2.0

## 1. Identifikasi Proyek

- **Nama Proyek:** _Secure Web-Chat Application with End-to-End Encryption (E2EE)_
- **Algoritma Utama:**
  - **Key Exchange:** _Elliptic Curve Diffie-Hellman_ (ECDH) dengan kurva **P-256**
  - **Enkripsi Simetris:** _Advanced Encryption Standard_ (AES-128 / AES-256) dengan mode **AES-GCM** _(Galois/Counter Mode)_
  - **Key Derivation:** _HKDF (HMAC-based Key Derivation Function)_
- **Platform:** Aplikasi Berbasis Web (Browser)
- **Topologi Jaringan:** _1-on-1 Chat (Room-based via Signaling Relay Server)_
- **Autentikasi:** Firebase Authentication (Email + Password)
- **Target Ekspektasi Akademis:** Memenuhi komponen Project Based Learning (PBL) Mata Kuliah Kriptografi

---

## 2. Ringkasan Proyek (Executive Summary)

Proyek ini bertujuan untuk membangun sebuah aplikasi pesan instan berbasis web yang mengimplementasikan keamanan tingkat tinggi melalui _End-to-End Encryption_ (E2EE). Aplikasi ini menggabungkan tiga paradigma utama kriptografi modern:

1. **Kriptografi Asimetris (ECDH — Elliptic Curve Diffie-Hellman):** Digunakan untuk melakukan pertukaran kunci enkripsi secara aman di atas saluran komunikasi publik menggunakan kurva eliptik P-256. Pendekatan ini lebih modern dan efisien dibandingkan DH klasik, menghasilkan kunci yang lebih pendek namun dengan tingkat keamanan setara.
2. **Kriptografi Simetris (AES-GCM):** Digunakan untuk melakukan _authenticated encryption_ — enkripsi dan verifikasi integritas pesan secara simultan. Mode GCM menghasilkan _authentication tag_ yang mencegah manipulasi data (_tampering_). Pengguna dapat memilih antara AES-128 atau AES-256 melalui antarmuka aplikasi.
3. **Key Derivation (HKDF):** Digunakan untuk menurunkan kunci simetris AES dari _shared secret_ ECDH secara aman, mengikuti standar yang digunakan di protokol TLS 1.3 dan Signal Protocol.

Aplikasi dirancang khusus untuk kebutuhan akademis, di mana terdapat **Panel Transparansi Kriptografi (Crypto Log Console)** yang secara visual mendemonstrasikan seluruh proses kriptografi secara _real-time_ — mulai dari ECDH handshake, key derivation, enkripsi, hingga dekripsi.

---

## 3. Tujuan Produk & Kriteria Sukses (Objectives & Success Criteria)

| Tujuan | Kriteria Sukses | Metrik Validasi |
|--------|----------------|-----------------|
| **Kerahasiaan Data** _(Confidentiality)_ | Pesan yang melewati jaringan dan server selalu dalam bentuk _ciphertext_. Server tidak dapat membaca isi pesan. | Inspeksi lalu lintas WebSocket di browser DevTools menunjukkan hanya _ciphertext_. |
| **Integritas Data** _(Integrity)_ | Pesan tidak dapat dimodifikasi tanpa terdeteksi berkat _authentication tag_ AES-GCM. | Modifikasi _ciphertext_ secara manual menghasilkan error dekripsi. |
| **Otentikasi Sesi** _(Session Authentication)_ | Setiap sesi chat menghasilkan kunci simetris unik (_ephemeral key_) melalui ECDH di browser masing-masing pengguna. | Dua sesi berbeda menghasilkan _shared key_ yang berbeda (diverifikasi via Crypto Log). |
| **Otentikasi Pengguna** _(User Authentication)_ | Hanya pengguna terautentikasi via Firebase yang dapat mengakses fitur chat. Server memverifikasi Firebase ID Token sebelum mengizinkan koneksi Socket.IO. | User tanpa login tidak dapat terkoneksi ke WebSocket. |
| **Visualisasi Edukatif** | Crypto Log Console menampilkan data kriptografi secara transparan dan detail untuk demonstrasi akademis. | Seluruh 7 kategori data kriptografi tampil di Crypto Log saat sesi berlangsung. |

---

## 4. Ruang Lingkup Fitur (Scope & Key Features)

### A. Fitur Utama (In-Scope — MVP)

1. **Autentikasi Pengguna (Firebase Auth):**
   - Registrasi dan login menggunakan Email + Password via Firebase Authentication.
   - Verifikasi Firebase ID Token di server Node.js menggunakan Firebase Admin SDK sebelum mengizinkan koneksi Socket.IO.

2. **Sesi Obrolan 1-on-1 Real-Time (Room-Based):**
   - Pengguna memasukkan nama/kode room setelah login.
   - Dua pengguna yang memasukkan kode room yang sama akan dipasangkan secara otomatis.
   - Komunikasi _real-time_ dua arah menggunakan protokol WebSocket (Socket.IO).

3. **Automated ECDH Handshake:**
   - Saat kedua pengguna terhubung di room yang sama, browser masing-masing secara otomatis membangkitkan pasangan kunci ECDH (P-256) menggunakan Web Crypto API.
   - Kunci publik ditukar melalui server relay (server hanya meneruskan, tidak menyimpan).
   - _Shared secret_ dihitung secara independen di masing-masing browser.
   - Kunci simetris AES diturunkan dari _shared secret_ menggunakan HKDF.

4. **AES-GCM Encryption/Decryption On-the-Fly:**
   - Pengguna dapat memilih ukuran kunci AES (128-bit atau 256-bit) melalui antarmuka.
   - Enkripsi teks dilakukan tepat sebelum data dikirim ke WebSocket.
   - Dekripsi dilakukan tepat setelah data diterima dari WebSocket.
   - Setiap pesan menggunakan IV/Nonce unik yang dikirimkan bersama _ciphertext_.
   - _Authentication tag_ AES-GCM memastikan integritas pesan.

5. **Crypto Log Console (Sidebar Toggle):**
   - Panel sidebar yang dapat ditampilkan/disembunyikan dengan tombol toggle.
   - Menampilkan data kriptografi berikut secara _real-time_:
     - **Parameter ECDH:** Public key (format JWK/hex), private key fingerprint, informasi kurva (P-256).
     - **Shared Secret:** Fingerprint/hash dari derived key (bukan raw value untuk keamanan).
     - **Ciphertext:** Pesan terenkripsi dalam format hexadecimal.
     - **IV/Nonce:** Nilai initialization vector unik untuk setiap pesan.
     - **Authentication Tag:** Tag autentikasi dari AES-GCM.
     - **Timestamp:** Waktu setiap operasi kriptografi.
     - **Status Koneksi:** Progress handshake dan status sesi terenkripsi.

6. **Tema Dark/Light:**
   - Dark theme sebagai tema default (estetika cybersecurity).
   - Toggle button untuk beralih ke light theme.

### B. Fitur di Luar Lingkup (Future Work)

1. **Secure File Transfer:** Fitur enkripsi file dokumen (PDF/Word/Image) menggunakan kunci AES sebelum dikirimkan. _Fitur ini BUKAN bagian dari implementasi saat ini dan akan dipertimbangkan sebagai pengembangan di masa depan._
2. **Persistent Chat History:** Penyimpanan riwayat pesan di database. _Sengaja tidak diimplementasikan karena bertentangan dengan sifat kunci sesi yang ephemeral dan prinsip E2EE._
3. **Group Chat:** Perluasan ke obrolan grup dengan lebih dari 2 peserta. _Membutuhkan protokol key management yang lebih kompleks._

---

## 5. Arsitektur Sistem & Alur Kriptografi

### A. Komponen Arsitektur

| Komponen | Teknologi | Tanggung Jawab |
|----------|-----------|----------------|
| **Client Frontend** (Browser Alice & Bob) | HTML5, CSS3, Vanilla JavaScript, Web Crypto API | Seluruh proses kriptografi (key generation, ECDH, HKDF, AES-GCM encrypt/decrypt). Server tidak boleh mengetahui kunci privat maupun _shared key_. |
| **Signaling/Relay Server** (Backend) | Node.js, Express.js, Socket.IO, Firebase Admin SDK | Meneruskan _ciphertext_ dan kunci publik ECDH antara klien. Memverifikasi Firebase ID Token. Tidak memiliki akses ke kunci privat atau pesan _plaintext_. |
| **Authentication Provider** | Firebase Authentication | Menyediakan layanan autentikasi Email + Password. Mengeluarkan ID Token yang diverifikasi oleh server. |

### B. Alur Logika (Kombinasi ECDH + HKDF + AES-GCM)

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Alice   │         │ Node.js      │         │   Bob    │
│ (Browser)│         │ Relay Server │         │ (Browser)│
└────┬─────┘         └──────┬───────┘         └────┬─────┘
     │                      │                      │
     │  1. Firebase Login   │   1. Firebase Login  │
     │─────────────────────>│<─────────────────────│
     │  (ID Token)          │          (ID Token)  │
     │                      │                      │
     │  2. Socket.IO Connect│   2. Socket.IO Connect
     │  + ID Token          │   + ID Token         │
     │─────────────────────>│<─────────────────────│
     │  (Token verified)    │    (Token verified)  │
     │                      │                      │
     │  3. Join Room "xyz"  │   3. Join Room "xyz" │
     │─────────────────────>│<─────────────────────│
     │                      │                      │
     │  4. Generate ECDH    │   4. Generate ECDH   │
     │     Key Pair (P-256) │      Key Pair (P-256)│
     │  publicKeyA, privKeyA│  publicKeyB, privKeyB│
     │                      │                      │
     │  5. Send publicKeyA  │                      │
     │─────────────────────>│  5. Forward to Bob   │
     │                      │─────────────────────>│
     │                      │                      │
     │                      │  6. Send publicKeyB  │
     │  6. Forward to Alice │<─────────────────────│
     │<─────────────────────│                      │
     │                      │                      │
     │  7. ECDH deriveBits  │   7. ECDH deriveBits │
     │  sharedSecret =      │   sharedSecret =     │
     │  ECDH(privA, pubB)   │   ECDH(privB, pubA)  │
     │                      │                      │
     │  8. HKDF deriveKey   │   8. HKDF deriveKey  │
     │  AES Key = HKDF(     │   AES Key = HKDF(    │
     │    sharedSecret)     │     sharedSecret)    │
     │                      │                      │
     │  ══════ Encrypted Session Established ══════│
     │                      │                      │
     │  9. Encrypt("Halo")  │                      │
     │  AES-GCM(key, IV,    │                      │
     │    "Halo") →         │                      │
     │  {ciphertext, tag,IV}│                      │
     │─────────────────────>│  9. Relay ciphertext │
     │                      │─────────────────────>│
     │                      │                      │
     │                      │  10. Decrypt(cipher) │
     │                      │  AES-GCM(key, IV,    │
     │                      │    ciphertext, tag)  │
     │                      │    → "Halo"          │
```

**Detail Langkah-langkah:**

1. Alice dan Bob login melalui Firebase Auth (Email + Password) dan mendapatkan Firebase ID Token.
2. Browser masing-masing membuka koneksi Socket.IO ke server Node.js, mengirimkan ID Token. Server memverifikasi token menggunakan Firebase Admin SDK.
3. Setelah terautentikasi, pengguna memasukkan kode room. Server memasangkan dua pengguna di room yang sama.
4. Browser Alice dan Bob masing-masing membangkitkan pasangan kunci ECDH (P-256) menggunakan `crypto.subtle.generateKey()`.
5. Alice mengirim kunci publik-nya ke Bob melalui server relay. Server hanya meneruskan tanpa menyimpan.
6. Bob mengirim kunci publik-nya ke Alice melalui server relay.
7. Alice menghitung _shared secret_ menggunakan `crypto.subtle.deriveBits()` dengan kunci privat-nya dan kunci publik Bob. Bob melakukan hal yang sama dengan kunci privat-nya dan kunci publik Alice. Kedua _shared secret_ dijamin sama secara matematis.
8. Masing-masing browser menurunkan kunci simetris AES (128 atau 256-bit, sesuai pilihan user) dari _shared secret_ menggunakan `crypto.subtle.deriveKey()` dengan algoritma HKDF.
9. Saat Alice mengirim pesan "Halo", browser Alice mengenkripsinya menggunakan AES-GCM dengan kunci yang diturunkan dan IV/Nonce unik. Hasil enkripsi berupa _ciphertext_, _authentication tag_, dan IV dikirim ke server.
10. Server meneruskan paket terenkripsi ke Bob. Browser Bob mendekripsi menggunakan kunci yang sama. Jika _authentication tag_ valid, pesan asli "Halo" ditampilkan.

---

## 6. Spesifikasi Teknologi (Tech Stack)

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Antarmuka dengan font Arial (regulasi presentasi). Dark/Light theme toggle. |
| **Kriptografi Sisi Klien** | Web Crypto API (`crypto.subtle`) | API native browser (W3C standard) untuk ECDH, HKDF, AES-GCM. Tidak membutuhkan library pihak ketiga. |
| **Backend Server** | Node.js + Express.js + Socket.IO | Relay server untuk _real-time bidirectional communication_. Verifikasi Firebase ID Token. |
| **Autentikasi** | Firebase Authentication + Firebase Admin SDK (Node.js) | Email + Password auth. Token verification di server-side. |
| **Environment Pengujian** | Jaringan lokal (LAN / Localhost) | — |

---

## 7. Error Handling & Edge Cases

| Skenario | Penanganan |
|----------|------------|
| **User disconnect di tengah chat** | Sesi terenkripsi berakhir. Partner menerima notifikasi "User disconnected". Jika user reconnect, ECDH handshake baru dilakukan dan kunci sesi baru dibangkitkan (forward secrecy). |
| **User ketiga mencoba masuk ke room penuh** | Server menolak koneksi dengan pesan error "Room is full (max 2 participants)". User diarahkan kembali ke halaman pemilihan room. |
| **ECDH handshake gagal** | Retry otomatis hingga 3 kali. Jika tetap gagal, tampilkan pesan error dan opsi untuk membuat sesi baru. |
| **Firebase token expired** | Client secara otomatis me-refresh token menggunakan Firebase SDK. Jika refresh gagal, user diarahkan ke halaman login. |
| **Dekripsi gagal (authentication tag invalid)** | Pesan ditandai sebagai "⚠️ Integrity check failed — message may have been tampered with" dan tidak ditampilkan sebagai teks. Insiden dicatat di Crypto Log. |
| **Browser tidak mendukung Web Crypto API** | Tampilkan pesan error saat halaman dimuat: "Browser Anda tidak mendukung fitur kriptografi yang diperlukan. Gunakan browser modern (Chrome/Firefox/Edge terbaru)." |
| **Timeout sesi idle** | Tidak ada timeout otomatis. Sesi tetap aktif selama koneksi WebSocket terbuka. Sesi berakhir saat user menutup tab atau disconnect. |

---

## 8. Security Considerations

### A. Ancaman yang Dimitigasi

| Ancaman | Mitigasi | Mekanisme |
|---------|----------|-----------|
| **Man-in-the-Middle (MITM)** | Kunci privat tidak pernah meninggalkan browser. Server hanya merelay kunci publik dan _ciphertext_. | ECDH key exchange + E2EE |
| **Eavesdropping** | Pesan yang melewati jaringan selalu dalam bentuk terenkripsi. | AES-GCM encryption |
| **Message Tampering** | Setiap modifikasi _ciphertext_ akan terdeteksi dan ditolak. | AES-GCM authentication tag |
| **Replay Attack** | Setiap pesan menggunakan IV/Nonce unik. Penggunaan ulang ciphertext yang sama akan gagal. | Unique IV per message |
| **Session Hijacking** | Firebase ID Token diverifikasi di server. Koneksi Socket.IO tidak dapat dibuat tanpa token valid. | Firebase Auth + server-side token verification |
| **Key Compromise (past sessions)** | Setiap sesi menggunakan kunci ephemeral baru. Kompromi satu sesi tidak mempengaruhi sesi lain. | Ephemeral ECDH keys (forward secrecy) |

### B. Batasan Keamanan (Known Limitations)

- **Tidak ada verifikasi identitas kunci publik:** Aplikasi ini tidak mengimplementasikan mekanisme _key fingerprint verification_ (seperti QR code scan pada Signal). Ini berarti MITM attack pada level server masih secara teori memungkinkan jika server dikompromi.
- **Trust on server:** Pengguna mempercayai bahwa server meneruskan kunci publik dengan benar tanpa manipulasi.
- **Tidak ada Perfect Forward Secrecy per-pesan:** PFS berlaku per-sesi, bukan per-pesan. Semua pesan dalam satu sesi menggunakan kunci yang sama.

---

## 9. Timeline & Milestone

| Hari | Milestone | Deliverable |
|------|-----------|-------------|
| 1–2 | **Setup & Infrastruktur** | Setup project Node.js + Express + Socket.IO. Konfigurasi Firebase project (Auth). Struktur folder frontend. |
| 3–4 | **Autentikasi** | Halaman login/register dengan Firebase Auth. Server-side token verification. Proteksi route Socket.IO. |
| 5–6 | **Real-Time Chat (Tanpa Enkripsi)** | Room-based pairing. Pengiriman/penerimaan pesan via Socket.IO (plaintext dulu). UI chat dasar. |
| 7–8 | **Implementasi Kriptografi** | ECDH key exchange via Web Crypto API. HKDF key derivation. AES-GCM encrypt/decrypt on-the-fly. Pemilihan AES-128/256 di UI. |
| 9–10 | **Crypto Log Console** | Sidebar toggle panel. Tampilkan 7 kategori data kriptografi. Real-time logging setiap operasi. |
| 11–12 | **UI Polish & Tema** | Dark theme (default) + Light theme toggle. Responsive design. Micro-animations. Error handling UI. |
| 13–14 | **Testing & Dokumentasi** | End-to-end testing. Bug fixing. Dokumentasi deployment. Persiapan presentasi. |

---

## 10. Deployment Plan

### A. Environment Pengembangan

```bash
# Clone repository
git clone <repo-url>
cd secure-web-chat

# Install dependencies (server)
npm install

# Setup Firebase
# 1. Buat project di Firebase Console (https://console.firebase.google.com)
# 2. Aktifkan Email/Password authentication
# 3. Download service account key (JSON) untuk Admin SDK
# 4. Buat file .env dengan konfigurasi Firebase

# Jalankan server
npm run dev
```

### B. Environment Variabel

```env
# .env
PORT=3000
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

### C. Skenario Demo (Presentasi)

1. Buka **dua browser window** (atau dua browser berbeda) pada satu komputer, atau dua komputer di jaringan LAN yang sama.
2. Akses `http://localhost:3000` di kedua browser.
3. **Browser 1 (Alice):** Register/Login → Masukkan room code "demo-room" → Tunggu partner.
4. **Browser 2 (Bob):** Register/Login → Masukkan room code "demo-room" → Otomatis terpasangkan.
5. Buka **Crypto Log Console** di kedua browser untuk menunjukkan proses ECDH handshake.
6. Kirim pesan dari Alice → Tunjukkan ciphertext di Crypto Log → Tunjukkan plaintext yang muncul di sisi Bob.
7. (Opsional) Buka browser DevTools → Tab Network → Inspeksi payload WebSocket untuk menunjukkan bahwa pesan yang lewat adalah _ciphertext_.

---

## Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | — | Dokumen awal |
| 2.0 | 2026-06-03 | Migrasi DH → ECDH (P-256). Tambah AES-GCM mode & opsi key size. Ganti CryptoJS → Web Crypto API. Tambah HKDF. Ganti Flask → Node.js + Express + Socket.IO. Tambah Firebase Auth. Detail Crypto Log Console. Tambah tema dark/light. Tambah bagian Error Handling, Security Considerations, Timeline, Deployment Plan. Pindahkan File Transfer ke Future Work. |
