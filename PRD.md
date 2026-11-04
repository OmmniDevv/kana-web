# PRD KANA Web

## Tujuan
KANA Web adalah aplikasi web pendamping bot WhatsApp KANA (repo GitHub OmmniDevv/kana-md). Web ini memberi tiga hal dalam satu tempat: halaman publik yang memperkenalkan bot, katalog plugin yang selalu segar dari GitHub, dan dashboard pribadi untuk member serta owner setelah masuk memakai kode WhatsApp.

## Pengguna
1. Pengunjung publik yang ingin tahu apa itu KANA dan plugin apa saja yang tersedia.
2. Member, yaitu pengguna bot yang sudah terdaftar dan ingin melihat statistik dirinya.
3. Owner, yaitu pemilik bot yang ingin melihat statistik keseluruhan bot.

## Fitur
1. Landing publik dengan hero banner resmi, statistik ringkas katalog, penjelasan cara kerja login, seksi fitur, dan ajakan masuk dashboard.
2. Katalog plugin publik di rute /plugins. Data diambil langsung dari GitHub repo OmmniDevv/kana-md lewat Git Trees API dan raw content, dengan cache ISR 3600 detik. Pengunjung bisa mencari, memfilter kategori lewat tab, menyalin kode plugin, melihat pratinjau kode, dan mengunduh file .js.
3. Login member dengan kode WhatsApp yang diminta dari web. Ini alur resmi baru dan bukan perintah bot.
4. Dashboard member di rute /dashboard yang menampilkan profil, level dan progres XP, limit harian tersisa, saldo, pekerjaan, klan, inventaris, hewan peliharaan, dan riwayat klaim.
5. Dashboard owner di rute /dashboard yang sama. Isinya bergantung peran sesi. Owner melihat panel tambahan berisi total pengguna, papan peringkat XP 10 teratas, jumlah plugin, status bot, dan kesehatan scraper bila tersedia.
6. Mode demo. Bila KANA_DATABASE_URL kosong, web berjalan dengan DemoAdapter dan data contoh berlabel DEMO yang terlihat jelas di antarmuka.

## Alur Login Web Initiated
1. Member membuka /login dan mengisi nomor WhatsApp.
2. Server web membuat kode 6 digit, menyimpan hash sha256 kode itu ke storage bersama pada namespace web_login_requests dengan status pending dan masa berlaku 10 menit. Versi teks biasa kode hanya disimpan sementara agar dibaca bot, dan tidak pernah ditampilkan di mode supabase.
3. Bot dari tim lain mempolling record pending, mengirim kode lewat WhatsApp ke nomor member, menandai status menjadi sent, dan menghapus field codePlain.
4. Member memasukkan kode di web. Server memverifikasi hash dengan perbandingan aman waktu, menandai record menjadi used, menghapus codePlain, lalu membuat cookie sesi bertanda tangan HMAC.
5. Member diarahkan ke /dashboard.

## User Story
1. Sebagai pengunjung, aku ingin melihat daftar plugin KANA tanpa harus membuka GitHub, supaya aku cepat tahu kemampuan bot.
2. Sebagai member, aku ingin masuk hanya dengan nomor WhatsApp dan kode sekali pakai, supaya aku tidak perlu kata sandi baru.
3. Sebagai member, aku ingin melihat level, XP, limit, saldo, inventaris, dan pet milikku dalam satu halaman.
4. Sebagai owner, aku ingin melihat total pengguna dan papan peringkat XP supaya aku tahu kesehatan komunitas bot.
5. Sebagai owner, aku ingin status bot tampil jujur. Bila bot belum menulis heartbeat, halaman menulis label menunggu data bot dan bukan angka karangan.

## Acceptance Criteria
1. GET / mengembalikan 200 dan memuat teks KANA serta statistik katalog.
2. GET /plugins mengembalikan 200 dan menampilkan kartu plugin dari data GitHub nyata dengan total plugin yang terlihat.
3. GET /login mengembalikan 200 dan form nomor bisa meminta kode.
4. GET /dashboard tanpa cookie mengarahkan ke /login.
5. Alur demo lengkap berjalan: POST /api/auth/request-code mengembalikan demoCode, POST /api/auth/verify dengan kode itu membuat sesi, GET /api/me dengan cookie mengembalikan 200 berisi profil demo, dan GET /dashboard dengan cookie mengembalikan 200.
6. Rate limit login berlaku: permintaan ulang dalam 2 menit ditolak 429 dan batas harian 5 kali ditolak 429.
7. Verifikasi kode salah menambah attempts dan ditolak 401. Setelah 5 kali gagal, kode tidak bisa dipakai lagi.
8. Endpoint unduh plugin menolak path traversal dengan 400 dan hanya menerima path yang diawali plugins/ dan berakhiran .js.
9. Endpoint statistik owner hanya bisa diakses peran owner, selain itu 403.
10. Build produksi bersih tanpa error TypeScript.
11. Mode demo selalu menampilkan banner MODE DEMO di halaman login dan dashboard.
12. Tidak ada em dash di semua konten.
