# Handoff: SVD Pilates demo sitesi (3D reformer) → Claude Code

## Amaç
Yunus (YayTech Studio, frontend geliştirici, İstanbul) küçük işletmelere site satıyor. Seçilen niş **butik pilates stüdyoları**. Plan şu: tek bir etkileyici şablon hazırlanacak, her stüdyo için tek bir config'ten özelleştirilecek, demo linki üretilip stüdyoya WhatsApp'tan tıkla-gönder yöntemiyle yollanacak. Bot kullanılmayacak, çünkü WhatsApp toplu otomasyonu numarayı banlıyor.

İlk gerçek hedef **SVD Pilates Stüdyo** (Fikirtepe). Bu stüdyo henüz müşteri değil. Site, onlara gösterilecek bir **satış demosu**.

Bu oturumun işi: mevcut tasarımı müşteriye gönderilebilir, "mükemmel" seviyeye getirmek. Yayınlama, config/JSON yapısı ve outreach otomasyonu **sonraya bırakıldı**, şimdi yapılmayacak.

## Mevcut durum
- Dosya: **`svd-pilates.html`**. Kullanıcıya sohbette gönderildi, kendisinde var. Tek dosya halinde.
  - three.js **r128**, cdnjs'ten UMD olarak yükleniyor.
  - Fontlar Google Fonts'tan: **Marcellus** (başlık) ve **Figtree** (metin).
  - Logo ve stüdyo fotoğrafı **base64 data URI** olarak gömülü. Orijinal görseller kullanıcıda.
  - Script'in başında **`STUDIO` config nesnesi** var: iletişim bilgileri, saatler, formatlar ve yorumlar.
- Onaylanan konsept: **"3D reformer"**. Kullanıcı bu fikri beğendi. Bu iterasyonda sadece incelik, cila ve eklemeler yapılacak, konsept değişmeyecek.

### Sayfa yapısı (sırasıyla)
1. **`.scene` (330vh, sticky stage)**
   - `#reformer` canvas'ında primitiflerden kurulmuş bir reformer var: ahşap gövde, nude minder, ayak barı, direkler ve 4 renkli yay (TubeGeometry helix, `scale.x` ile esniyor).
   - Etkileşim: taşıyıcı pointer ile sola sürükleniyor. Bırakınca yaylar sönümlü şekilde geri çekiyor. Dokunulana kadar otomatik "footwork" animasyonu oynuyor.
   - Yay paneli (`#springs`): kırmızı k4, yeşil k3, mavi k2, sarı k1. Açık/kapalı yapılabiliyor, direnç göstergesi ve seviye adı buna göre değişiyor.
   - Nefes metni hıza göre değişiyor: çekerken "Nefes ver", dönerken "Nefes al".
   - Scroll ile kamera 3 durak (`SHOTS`) arasında geçiyor, 3 "beat" metni sırayla açılıp kapanıyor.
2. **`#studyo`**: gerçek reformer odası fotoğrafı, parallax ile. Metin: "Aynı reformerlar, gerçek hâliyle."
3. **`#ders`**: 3 soruluk test ve saat seçici.
   - Saat seçici: format, 7 gün ve 08–22 arası saatler. Seçim bir WhatsApp linki üretiyor.
   - Testin "Bu formatla saat seç" butonu seçiciyi önceden dolduruyor.
4. **`#yorumlar`**: gerçek Google yorumlarından kısaltılmış alıntılar, tek tek dönen büyük alıntı olarak.
5. **`#iletisim`** (espresso zemin), footer ("Tasarım: YayTech Studio") ve mobilde sabit alt bar (Ara, WhatsApp).

## SVD bilgileri (kamuya açık işletme bilgisi)
- **Temel:** Adres, telefon/WhatsApp ve Instagram `STUDIO` nesnesinde. Her gün 08:00–22:00 açık. Google'da 5.0 puan.
- **Formatlar ve programlar:** Grup, Bireysel ve Double. Instagram öne çıkanlarındaki özel programlar: Hamile, Bel fıtığı, Boyun-sırt ağrısı.
- **Aletler (fotoğraflarda görünen):** Reformer, Cadillac, Chair. Slogan (Instagram bio'su): "Güçlen • Sıkılaş • Doğru hareket et".
- **Eğitmenler (Instagram'dan):** Sevda Ulusinan (kurucu), Hayrunisa Erdoğan, Elif Demirata. Unvanları "Pilates eğitmeni ve hareket uzmanı". Yorumlarda en çok adı geçen "Sevda Hoca", sonra "Nisa Hoca".
- **Marka renkleri:** logo zemini nude pembe `#E1C4B4`, bakır yazı, espresso kahve (kıyafetler), doğal ahşap (reformerlar).
- **Uydurma veri koyma:** ders programı ve fiyatlar bilinmiyor, o yüzden bilerek konmadı.
- **Yayın uyarısı:** gerçek markanın adı, logosu ve fotoğrafları kullanılıyor, stüdyo henüz onay vermedi. Anlaşmadan önce halka açık bir alan adına koyma. Sadece `noindex` işaretli bir demo linki kullanılabilir.

## Kullanıcının kuralları ve geri bildirimleri (önemli)
- **Hiçbir bölümde eyebrow ya da üst etiket olmayacak.** Küçük büyük harfli "Fikirtepe · X" gibi etiketleri kullanıcı "AI slop" diye reddetti.
- **Reddedilenler:**
  - Genel, sıkıcı hero'lar.
  - Anatomik ya da klinik his. İlk denemedeki omurga konsepti bu yüzden reddedildi.
  - Soyut WebGL blob. İkinci denemedeki vişne rengi nefes blobu "havada kalıyor" diye reddedildi.
  - Kemer çerçeveli, fotoğraf ağırlıklı klasik butik tasarım. Üçüncü deneme bu yüzden "AI slop" sayıldı.
  - İnce çizgili, zor okunan fontlar (Bodoni italik).
- **Beğenilenler:** ders testi, WhatsApp'a bağlanan form ve saat seçici, üst üste yığılan sticky kart fikri, nefes fikri (etkileşime yedirilmiş hali) ve 3D reformer.
- **Hedef:** siteye giren "vay" demeli ve 24 saat unutmamalı. Önce Yunus'un içine sinmeli. Portföyde de iyi durmalı.
- **Kod tercihleri:** Aşırı mühendislik yok, basit olan karmaşıktan iyidir. Her fonksiyonun tek sorumluluğu olsun. Gereksiz runtime kontrolü koyma, hataları TypeScript yakalasın.
- **Test tercihleri:**
  - **Tarayıcıda görsel test yapma.** Görsel ve mobil testi kullanıcı kendisi yapıp söyleyecek.
  - Build testini sadece kırılma riski olan değişikliklerde yap.
- **İletişim:** Türkçe, dürüst, gerektiğinde "roast" modu. Ama boş eleştiri değil, iş yap.

## Bu oturumda yapılacaklar
1. **Görsel ince ayar.**
   - Reformerı daha gerçekçi yap: malzeme ve ışık, kayışlar/halatlar, yay kancaları, minder dikiş hissi, köşe yuvarlatma (RoundedBox ya da bevel).
   - İsteğe bağlı: Blender'dan ya da hazır bir `.glb` reformer modeli, GLTFLoader ile.
   - Kamera açılarını, beat geçişlerini, tipografi ölçeğini ve boşlukları rafine et.
2. **Mobil mükemmellik.**
   - Sürükleme ile dikey scroll çakışmasını kontrol et (`touch-action: pan-y`).
   - Panelin ve beat metinlerinin çakışmasını ve dar ekranda kamera kadrajını kontrol et.
   - Düşük donanımlı telefonlarda performansı iyileştir: gölge haritası 2048 → 1024, pixelRatio sınırı.
3. **Form iyileştirme.** Saat seçiciye isim alanı, WhatsApp mesajına isim eklenmesi, daha net seçili durumlar ve boş durum metinleri eklenebilir. Uydurma kontenjan koyma.
4. **"Ekibimiz" bölümü.** Kullanıcı eğitmen fotoğraflarını ekleyecek. Bu bölüm eyebrow olmadan, konsepte uygun tasarlanmalı.
5. **Dosya yapısı (öneri).** Claude Code'da tek dosyayı şöyle ayırmak mantıklı:
   - `index.html`
   - `styles.css`
   - `config.js` (STUDIO nesnesi)
   - `reformer.js` (3D kısım)
   - `app.js` (test, saat seçici, yorumlar)
   - `assets/` (base64 yerine gerçek görsel dosyaları)

   Sade tut, framework ya da build aracı şart değil.

## Bilinen riskler ve notlar
- **Hint metni ve kamera yönü:** "Taşıyıcıyı sola çek" metni kameranın 3/4 açısına göre yazıldı. Kuşbakışı duraktaki (SHOTS[2]) sürükleme yönünü kontrol et.
- **Performans:** Taşıyıcı ve yaylar her karede güncelleniyor. Render döngüsü görünürlüğe (IntersectionObserver) bağlı.
- **Yorumlar:** Google'dan birebir alınmış ama kısaltılmış alıntılar. Anlamı değiştirme.
- **Tema:** Site bilinçli olarak tek temalı, dark mode yok.

## Sonraya bırakılanlar (bu oturumda yapma)
- **Config ve demo:** Config'i `studios.json` haline getirmek. Tek deploy ile `?s=slug` üzerinden sınırsız demo üretmek.
- **Outreach:** Maps'ten lead listesi (CSV) çıkarmak. Her stüdyo için demo linki ve kişiselleştirilmiş `wa.me` linki üreten bir "tıkla-gönder" panosu yapmak. Mesaj şablonları hazırlamak.
- **Fiyatlandırma:** Kurulum ve aylık bakım paketi fiyatlarını belirlemek.

## Önerilen skill'ler
- **`impeccable`**: görsel cila, hiyerarşi, hareket ve mobil uyum. Ana iş bu.
- **`frontend-design`**: estetik kararlarda "hazır şablon" görünümünden kaçınmak için.
- **`design:ux-copy`**: Türkçe başlık, buton ve form metinleri.
- **`design:accessibility-review`**: müşteriye göndermeden önce son kontrol (kontrast, dokunma alanları, klavye).
