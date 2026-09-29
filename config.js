/* Studio-specific data read by app.js and reformer.js.
   Static copy in index.html (beats, photo caption) is still SVD-specific. */
const STUDIO = {
  name: "SVD Pilates Stüdyo",
  whatsapp: "905453445583",
  phone: "0545 344 55 83",
  address: "Evinpark Çarşı, Fikirtepe, Mandıra Cd. No:189, 34744 Kadıköy / İstanbul",
  mapsQuery: "SVD Pilates Studio Evinpark Çarşı Fikirtepe",
  instagram: "svdpilatesstudio",
  open: 8, close: 22,
  formats: ["Grup", "Bireysel", "Double"],
  // Members without a photo are not rendered; the section hides itself when none have one.
  team: [
    { name: "Sevda Ulusinan", role: "Kurucu, pilates eğitmeni ve hareket uzmanı", photo: "assets/team/sevda.jpg" },
    { name: "Hayrunisa Erdoğan", role: "Pilates eğitmeni ve hareket uzmanı", photo: "assets/team/nisa.jpg" },
    { name: "Elif Demirata", role: "Pilates eğitmeni ve hareket uzmanı", photo: "assets/team/elif.jpg" }
  ],
  reviews: [
    { who: "Sena", text: "Şu an 20 dersi tamamladım ve kendimde gözle görülür bir fark hissediyorum." },
    { who: "Zeynep B.", text: "Bu güzel yer şimdi annem için de şifa oldu. Skolyoz kaynaklı sırt ağrıları belirgin şekilde azaldı." },
    { who: "Cansel A.", text: "Henüz 10 ders almama rağmen gözle görülür bir fark var vücudumda. Keşke daha önceden başlasaymışım." },
    { who: "İdil", text: "Kendinizi güvende hissedeceğiniz, bir dersin nasıl geçtiğini anlamayacağınız bir stüdyo." },
    { who: "Tuğba Ç.", text: "Hareketleri doğru ve güvenli şekilde yaptırmaya özen gösteriyor, bireysel ihtiyaçlara göre ilgileniyor." },
    { who: "Bilal B.", text: "Temiz, ferah ve çok özenle hazırlanmış bir stüdyo. Sevda Hoca gerçekten işini biliyor." }
  ]
};
