# AGENTS.md KANA Web

Konvensi kerja untuk agen yang mengerjakan proyek ini.

## Umum
- Bahasa antarmuka dan dokumentasi adalah Bahasa Indonesia.
- Tanpa em dash di semua file konten dan kode. Gunakan tanda hubung biasa bila perlu.
- Jangan push ke GitHub dan jangan deploy dari tugas pembangunan lokal tanpa perintah parent.
- Jangan membuat issue Paperclip untuk proyek ini.
- Rahasia hanya lewat variabel lingkungan server. KANA_DATABASE_URL dan SESSION_SECRET tidak pernah dikirim ke klien.

## Next.js
- Proyek ini memakai Next.js 16.4.3, React 19.3.0, TypeScript, dan Tailwind CSS 4.
- Versi Next.js ini punya breaking changes dibanding pengetahuan umum. Sebelum menulis kode API, route handler, cookies, atau ISR, baca dulu dokumen di node_modules/next/dist/docs/ yang relevan.
- App Router di src/app. Route handler memakai ekspor fungsi GET dan POST dari route.ts.
- Halaman katalog dan pengambilan data GitHub memakai ISR dengan export const revalidate = 3600 dan fetch dengan next revalidate 3600.
- Cookie sesi dibaca dan ditulis lewat API cookies dari next/headers sesuai dokumen Next 16.

## Kode
- Dependensi inti seminimal mungkin: next, react, react-dom, dan pg. Tanpa library ikon dan tanpa library auth.
- Sesi ditandatangani memakai HMAC SHA256 dari node:crypto.
- Hash kode login memakai sha256 dari node:crypto dan perbandingan timingSafeEqual.
- Akses data selalu lewat DataAdapter di src/lib/data. Halaman dan API tidak query Postgres langsung.
- Normalisasi nomor selalu lewat fungsi normalizePhone di src/lib/phone.ts.
- Kirim heartbeat Hackatime tiap file kode yang dibuat atau diubah.

## Verifikasi
- npm run build wajib bersih sebelum dinyatakan selesai.
- Uji lokal wajib mencakup halaman beranda, plugin, login, redirect dashboard, dan alur demo request-code sampai verify dan /api/me.
