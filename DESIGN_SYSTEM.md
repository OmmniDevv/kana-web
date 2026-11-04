# Sistem Desain KANA Web

## Arah Visual
Tema gelap hitam dengan hijau neon mengikuti banner resmi KANA. Tampilan berani seperti galeri dan sampul tebal, dengan gerak mikro yang halus dan tetap menghormati prefers-reduced-motion.

## Token Warna
- Latar utama: #06090a
- Panel: #0b120e
- Panel terang: #101a13
- Garis tepi: #1d2b20
- Aksen hijau neon: #3dff5e
- Aksen lime: #a3ff5e
- Teks utama: #e8f5ea
- Teks redup: #9db8a4
- Bahaya: #ff5d6c
- Peringatan: #ffd23d

## Tipografi
- Font utama: Plus Jakarta Sans lewat next/font/google.
- Judul besar memakai bobot 800 dengan spasi huruf rapat.
- Angka statistik memakai animasi popIn saat tampil.
- Label kategori memakai huruf kapital kecil dengan spasi huruf lebar.

## Spasi dan Bentuk
- Radius kartu: 20px.
- Radius tombol: 999px untuk tombol utama dan 14px untuk tombol kartu.
- Jarak seksi desktop: 96px vertikal.
- Jarak seksi mobile: 56px vertikal.
- Lebar konten maksimal: 1200px dengan padding samping 24px.

## Komponen
- Hero: banner full bleed dengan lapisan gelap, cahaya hijau berdenyut pelan, dan gerakan pan lambat.
- Kartu katalog: sampul tebal per kategori, tipografi nama besar, efek hover lift, dan tombol Unduh serta Salin Kode.
- Tab kategori: indikator meluncur dan transisi halus antar filter.
- Kartu statistik: angka besar dengan animasi popIn dan label redup.
- Form login: panel gelap, status langkah yang jelas, centang sukses dengan animasi checkPop, dan guncangan shake saat error.
- Skeleton: efek shimmer saat data memuat.
- Banner demo: pita peringatan kuning dengan teks MODE DEMO yang selalu terlihat di mode demo.

## Gerak
Keyframes yang dipakai: fadeUp, popIn, shimmer, floaty, glowPulse, shake, checkPop.
Semua animasi dimatikan atau dikurangi bila pengguna mengaktifkan prefers-reduced-motion.
