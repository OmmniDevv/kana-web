# Riset Desain KANA Web

## Sesi 2026-11-04: redesign ke tema studio OmniDevv

Riset segar dilakukan langsung di keempat situs pada sesi pengembangan dashboard.

### godly.design
Temuan: galeri kurasi dengan visual besar yang dominan dan jarak antar kartu yang lega; karya tampil sebagai kartu visual, bukan daftar teks.
Penerapan: katalog plugin tetap berbentuk galeri kartu, kini dengan panel putih bersih, chip perintah mono yang bisa disalin langsung dari kartu, dan hierarki tipografi besar ala galeri.

### transitions.dev
Temuan: pustaka resep transisi mikro siap pakai, termasuk number pop-in, tabs sliding, skeleton loader and reveal, success check, error state shake, dan toggle.
Penerapan: angka statistik memakai pop-in, tab kategori memakai pil gradasi yang berpindah halus, form login memakai success check dan error shake, toggle tema terang gelap ditambahkan di navigasi, dan skeleton shimmer dipertahankan.

### animos.app
Temuan: showcase gerak berulang yang mulus dan ringan, loop tanpa lompatan yang terasa, dengan penekanan bahwa gerak harus melayani konten.
Penerapan: hero banner memakai slow pan dan glow berdenyut yang halus, kartu sambutan memakai floaty lembut, semua gerak menghormati prefers-reduced-motion.

### deck.gallery
Temuan: grid sampul tebal ala deck capabilities, komposisi bento dengan satu sampul besar dan kartu pendukung kecil, ornamen minim.
Penerapan: beranda direstruktur menjadi grid bento persis pola itu: kartu banner besar 2 kolom di samping dua kartu statistik, seksi langkah login dan fitur dalam kartu bento rounded-3xl, mengikuti juga layout bento seksi Capabilities portfolio OmniDevv.

### Design system portfolio OmniDevv
Tema LIGHT studio: latar putih, violet #8b5cf6, fuchsia #d946ef, Inter untuk teks dan JetBrains Mono untuk elemen teknis, bento Capabilities, plus toggle dark dan light. Semua halaman (beranda, katalog, detail plugin, login, dashboard) diselaraskan ke sistem ini.

## Sesi awal: tema gelap hijau neon (riwayat)

Ringkasan riset dari parent yang diterapkan langsung ke desain KANA Web.

## godly.design
Pola yang diambil: galeri kurasi dengan visual hero besar dan citra yang dominan.
Penerapan: hero memakai banner resmi full bleed sebagai citra utama. Kartu katalog plugin disusun seperti galeri kurasi dengan sampul visual yang kuat per kategori, bukan daftar teks polos.

## transitions.dev
Pola yang diambil: resep transisi mikro yang siap pakai.
Penerapan: angka statistik memakai number pop-in. Filter kategori memakai tabs sliding. Keadaan memuat memakai skeleton shimmer. Form login memakai success check saat berhasil dan error shake saat gagal. Kartu memakai hover lift.

## animos.app
Pola yang diambil: showcase gerak berulang yang halus.
Penerapan: hero banner mempunyai animasi glow dan slow pan yang halus. Kartu mempunyai gerak melayang lembut. Semua gerak menghormati prefers-reduced-motion.

## deck.gallery
Pola yang diambil: grid sampul tebal dengan ornamen minim.
Penerapan: katalog plugin tampil sebagai grid kartu sampul berani dengan tipografi besar per kategori, garis tepi tegas, dan dekorasi seminimal mungkin.
