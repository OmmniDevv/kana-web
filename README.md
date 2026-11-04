# KANA Web

Web pendamping bot WhatsApp KANA. Satu aplikasi untuk halaman publik, katalog plugin, dan dashboard member serta owner.

## Tentang
KANA adalah bot WhatsApp moe dari repo OmmniDevv/kana-md. KANA Web menampilkan katalog plugin yang selalu segar dari GitHub, menyediakan login memakai kode WhatsApp yang diminta dari web, dan menampilkan statistik pribadi member serta statistik bot untuk owner.

## Fitur
- Landing publik dengan hero banner resmi dan statistik katalog.
- Katalog plugin publik dengan pencarian, tab kategori, salin kode, pratinjau kode, dan unduh file .js.
- Login kode WhatsApp yang dimulai dari web, bukan dari perintah bot.
- Dashboard member berisi level, progres XP, limit harian, saldo, inventaris, pet, pekerjaan, klan, dan riwayat klaim.
- Dashboard owner berisi panel tambahan total pengguna, papan peringkat XP, jumlah plugin, dan status bot.
- Mode demo dengan data contoh berlabel jelas bila database belum diisi.

## Arsitektur Singkat
Next.js 16 App Router, React 19, TypeScript, dan Tailwind CSS 4. Data bersama bot berada di Postgres tabel bot.kv dan diakses server lewat adapter data. SupabaseAdapter memakai pg dan KANA_DATABASE_URL. DemoAdapter memakai data contoh in-memory. Sesi memakai cookie bertanda tangan HMAC dari node:crypto tanpa library auth tambahan. Katalog plugin diambil dari GitHub API dan raw content dengan cache ISR 3600 detik.

Dokumen lengkap ada di PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, dan docs/DESIGN_RESEARCH.md.

## Variabel Lingkungan
- KANA_DATABASE_URL: connection string Postgres Supabase KANA untuk tabel bot.kv. Kosong berarti mode demo.
- SESSION_SECRET: rahasia penanda tangan sesi. Wajib diisi di production.
- OWNER_NUMBER: nomor owner dalam format digit, contoh 62812xxxx. Nomor ini mendapat peran owner saat login.
- DATA_MODE: pilihan paksa adapter, isi supabase atau demo. Kosong berarti otomatis.
- GITHUB_TOKEN: token GitHub opsional untuk menaikkan batas API katalog.

Salin .env.example menjadi .env.local lalu isi nilainya di lokal. Jangan commit file .env.

## Cara Jalan Lokal
1. npm install
2. npm run dev
3. Buka http://localhost:3000

Untuk uji mode demo, biarkan KANA_DATABASE_URL kosong. Halaman login akan menampilkan kode demo di kotak peringatan DEMO setelah kode diminta.

Build produksi lokal:
1. npm run build
2. npm run start

## Cara Deploy Vercel
1. Buat proyek Vercel baru dari folder ini.
2. Isi variabel lingkungan KANA_DATABASE_URL, SESSION_SECRET, OWNER_NUMBER, dan bila perlu DATA_MODE serta GITHUB_TOKEN di pengaturan proyek.
3. Deploy. Framework preset Next.js akan terdeteksi otomatis.
4. Pastikan SESSION_SECRET tetap sama antar deploy agar sesi pengguna tidak hilang.

## Alur Login
1. Member mengisi nomor WhatsApp di halaman /login.
2. Server web membuat kode 6 digit, menyimpan hash kode ke namespace web_login_requests dengan status pending dan masa berlaku 10 menit.
3. Bot mempolling record pending, mengirim kode lewat WhatsApp, menandai status sent, dan menghapus kode teks biasa dari record.
4. Member memasukkan kode di web. Server memverifikasi, menandai record used, dan membuat cookie sesi.
5. Member masuk ke /dashboard sesuai perannya.

## Status Data
- Data asli AKTIF sejak 2026-11-04. Web berjalan dengan SupabaseAdapter (DATA_MODE supabase), bukan mode demo lagi.
- Proyek Supabase khusus KANA: nama kana-md, ref qvyvllvlvrlnzipjmplc, region ap-southeast-1, status ACTIVE_HEALTHY. Migrasi 0001_init.sql dari repo kana-md sudah dijalankan: tabel bot.kv dan bot.baileys_auth ada dengan RLS aktif.
- KANA_DATABASE_URL di env Vercel proyek kana-web berisi connection string pooler proyek itu (nilai tidak ditulis di repo), dan production sudah diredeploy. Verifikasi live 2026-11-04: /login 200 tanpa label demo, POST /api/auth/request-code untuk nomor owner membalas ok tanpa bidang demo, dan record web_login_requests berstatus pending benar-benar tertulis di bot.kv.
- Slot kuota didapat dengan menjeda proyek lama OmmniDevv's Project (ref xdjzykuzycncqprfnyfm, isi hampir kosong) atas persetujuan user. Proyek itu bisa direstore bila dibutuhkan lagi.
- Sisa langkah di sisi bot: pastikan bot KANA production memakai DATABASE_URL proyek yang sama (sudah ditulis ke .env lokal repo kana-md) dan watcher login webnya jalan, agar kode yang diminta dari /login terkirim lewat WhatsApp dan profil users terbaca dua arah.
- Perintah .webcode di bot hanya cadangan manual. Alur resmi login adalah kode yang diminta dari halaman /login seperti di atas.
