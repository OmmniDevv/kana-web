# Sistem Desain KANA Web

## Arah Visual
Tema studio terang mengikuti design system portfolio OmniDevv: latar putih bersih, aksen violet dan fuchsia, layout bento seperti seksi Capabilities portfolio, dengan mode gelap pendamping lewat toggle. Gerak mikro halus dan tetap menghormati prefers-reduced-motion.

## Token Warna
Mode terang (bawaan):
- Latar utama: #ffffff
- Latar lembut: #f8f6fd
- Panel: #ffffff
- Panel lembut: #f3effc
- Garis tepi: #e7e0f5
- Teks utama: #221c35
- Teks redup: #6e6584

Mode gelap:
- Latar utama: #130e21
- Panel: #1c1533
- Garis tepi: #342a58
- Teks utama: #f4f1ff
- Teks redup: #aba1c7

Aksen tetap di kedua mode:
- Violet: #8b5cf6
- Fuchsia: #d946ef
- Gradasi brand: linear 92deg dari violet ke fuchsia, dipakai untuk tombol utama, angka sorotan, dan teks gradasi.
- Bahaya: #d92642 (terang) dan #ff6b7e (gelap)
- Peringatan: #b45309 di atas #fef3c7 (terang), #ffd23d transparan (gelap)
- Blok kode: latar #17102b, teks #e9e4ff, font JetBrains Mono.

## Tipografi
- Font utama: Inter lewat next/font/google.
- Font mono: JetBrains Mono untuk perintah bot, path file, angka teknis, dan blok kode.
- Judul besar memakai bobot 800 sampai 900 dengan spasi huruf rapat.
- Angka statistik memakai animasi popIn saat tampil.
- Label kategori memakai huruf kapital kecil dengan spasi huruf lebar, berwarna fuchsia.

## Spasi dan Bentuk
- Radius kartu bento: 24px (rounded-3xl).
- Radius tombol: 999px untuk tombol utama dan 8 sampai 16px untuk chip perintah.
- Lebar konten maksimal: 1200px dengan padding samping 24px.
- Hero beranda adalah grid bento: kartu banner besar 2 kolom plus 2 kartu statistik bertumpuk.

## Komponen
- Hero: banner resmi di dalam kartu bento rounded dengan lapisan gelap, cahaya fuchsia berdenyut pelan, dan gerakan pan lambat.
- Kartu statistik: angka besar gradasi violet ke fuchsia dengan animasi popIn dan label redup.
- Kartu katalog: panel putih, chip kategori fuchsia, chip perintah mono yang bisa disalin, tombol Detail gradasi, Unduh, dan Salin Kode.
- Halaman detail plugin: kartu metrik bento, daftar perintah dengan tombol salin per perintah, dan blok kode sumber penuh.
- Tab kategori: pil aktif memakai gradasi brand dengan bayangan fuchsia lembut.
- Form login: panel terang, status langkah yang jelas, centang sukses gradasi dengan animasi checkPop, dan guncangan shake saat error.
- Toggle tema: tombol bulat di navigasi atas, pilihan tersimpan di localStorage kunci kana-theme, bawaan terang.
- Skeleton: efek shimmer saat data memuat.

## Gerak
Keyframes yang dipakai: fadeUp, popIn, shimmer, floaty, glowPulse, shake, checkPop, slowPan.
Semua animasi dimatikan atau dikurangi bila pengguna mengaktifkan prefers-reduced-motion.
