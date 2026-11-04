# Arsitektur KANA Web

## Gambaran
Aplikasi Next.js 16 App Router dengan TypeScript. Semua logika server berada di route handler dan library server. Klien hanya menerima data yang aman ditampilkan. Data bersama dengan bot disimpan di Postgres pada tabel bot.kv di proyek Supabase KANA.

## Struktur Modul
- src/app: halaman dan route handler. Beranda di page.tsx, katalog di plugins/page.tsx, login di login/page.tsx, dashboard di dashboard/page.tsx, dan API di app/api.
- src/app/layout.tsx: metadata, font Inter dan JetBrains Mono, navigasi atas dengan toggle tema, dan footer. Sesi dibaca di server untuk menentukan tombol Masuk atau Keluar.
- src/app/plugins/[slug]/page.tsx: halaman detail plugin berisi daftar perintah dengan tombol salin, metrik file, dan kode sumber penuh.
- src/lib/plugins.ts: pengambilan katalog plugin dari GitHub, parsing metadata config termasuk alias, usage, dan example menjadi daftar perintah, serta info commit untuk halaman detail.
- src/lib/session.ts: pembuatan dan verifikasi token sesi HMAC, serta pembacaan sesi dari cookie.
- src/lib/phone.ts: normalisasi dan validasi nomor Indonesia.
- src/lib/profile.ts: perhitungan level, progres XP, dan limit harian mengikuti user-service bot.
- src/lib/data: kontrak DataAdapter dan dua implementasinya.

## Adapter Data
Interface DataAdapter menyediakan getLoginRequest, putLoginRequest, deleteLoginRequest, getUserProfile, listUserKeys, getBotStatus, getDailyCount, dan bumpDailyCount.

SupabaseAdapter memakai pg Pool dari KANA_DATABASE_URL dan query ke tabel bot.kv dengan kolom ns, key, value jsonb, dan expires_at.

DemoAdapter aktif bila KANA_DATABASE_URL kosong. Adapter ini menyimpan record login di Map pada module scope dan menyediakan 3 profil contoh fiktif serta statistik bot contoh. Pada mode demo, endpoint request-code mengembalikan kode di respons agar alur bisa diuji tanpa bot, dan antarmuka menampilkannya dalam kotak peringatan DEMO.

Fungsi getAdapter memilih adapter berdasarkan DATA_MODE bila diisi dengan nilai supabase atau demo. Bila DATA_MODE kosong, pilihan otomatis mengikuti keberadaan KANA_DATABASE_URL.

## Kontrak KV dengan Bot
- Profil member: namespace users, key berupa digit nomor. Value mengikuti src/services/user-service.js di repo bot dengan field xp, balance, banned, registeredAt, name, limitDate, limitLeft, inventory, pet, job, clanId, lastDaily, lastHourly, dan lastWeekly.
- Level dihitung dengan rumus floor(sqrt(xp/50)) + 1. XP awal level L adalah 50 dikali (L-1) pangkat 2.
- Limit harian default 30. Bila limitDate tidak sama dengan tanggal hari ini di Asia/Jakarta, sisa limit dianggap 30. Selain itu sisa limit adalah limitLeft.
- Login requests: namespace web_login_requests, key berupa digit nomor, value berisi codeHash, codePlain, expiresAt, status, attempts, dan createdAt. Web juga menulis kolom expires_at sama dengan expiresAt. Status yang valid adalah pending, sent, used, dan expired.
- Rate limit harian: namespace web_login_ratelimit, key berupa gabungan nomor dan tanggal YYYY-MM-DD, value berisi count.
- Statistik bot: namespace kv, key bot_stats, value berisi startedAt, totalUsers, totalCommands, pluginCount, dan updatedAt dalam epoch milidetik, persis kontrak docs/WEB.md di repo bot. Namespace bot_status key heartbeat adalah cadangan lama dan hanya dibaca bila bot_stats tidak ada. Bila keduanya tidak ada, dashboard owner menampilkan keadaan kosong yang jujur dan hanya menampilkan angka katalog GitHub.

## Alur Login
1. POST /api/auth/request-code menerima nomor, menormalisasi, memeriksa rate limit jeda 2 menit dan batas harian 5, membuat kode 6 digit dengan crypto.randomInt, menyimpan hash sha256 dan record pending dengan masa berlaku 10 menit.
2. Bot mempolling record pending, mengirim kode lewat WhatsApp, mengubah status menjadi sent, dan menghapus codePlain.
3. GET /api/auth/status mengembalikan status record dan menandai expired bila lewat masa berlaku.
4. POST /api/auth/verify memeriksa record, masa berlaku, dan attempts di bawah 5, lalu membandingkan hash kode dengan timingSafeEqual. Sukses mengubah status menjadi used, menghapus codePlain, dan membuat cookie sesi.
5. Peran owner diberikan bila nomor sesi sama dengan OWNER_NUMBER. Selain itu peran adalah member.

## Keamanan Sesi
Token sesi adalah base64url dari JSON berisi phone, role, dan exp, diikuti titik dan tanda tangan HMAC SHA256 hex memakai SESSION_SECRET. Cookie bernama kana_session bersifat httpOnly, sameSite lax, path /, dan maxAge 7 hari. Atribut secure bernilai true kecuali pada localhost pengembangan. Bila SESSION_SECRET kosong, server memakai nilai fallback khusus pengembangan yang deterministik agar konsisten antar bundle halaman dan route handler. Production wajib mengisi SESSION_SECRET dengan nilai rahasia sendiri.

## Katalog Plugin
Daftar file diambil dari Git Trees API repo OmmniDevv/kana-md, disaring ke path plugins yang berakhiran .js. Isi mentah tiap file diambil dari raw.githubusercontent.com dengan cache 3600 detik hanya untuk memparse metadata, dan tidak dikirim ke klien katalog agar halaman tetap ringan untuk ratusan plugin. Metadata name, alias, category, description, usage, dan example diparse dari objek config dengan regex toleran. Daftar perintah tiap plugin adalah name ditambah alias, dan total perintah katalog adalah jumlah keduanya di semua plugin. Bila parsing gagal, fallback memakai nama file, folder induk, dan deskripsi generik dengan label sumber fallback. Halaman detail mengambil isi file dan tanggal commit dari Commits API per path, boleh kosong bila gagal.

## Unduh Plugin
GET /api/plugins/download memvalidasi path harus diawali plugins/, berakhiran .js, dan tidak mengandung titik titik atau backslash. Pelanggaran ditolak 400. Konten diambil dari GitHub raw dan dikirim sebagai attachment text/javascript.
