# Healthi - Kişisel Sağlıklı Yaşam Koçu

Gerçek bir Android fitness uygulaması. Kullanıcının fiziksel durumunu, hedeflerini, spor geçmişini, yaşam tarzını, ekipmanlarını, zamanını ve beslenme alışkanlıklarını analiz ederek kişiselleştirilmiş antrenman + beslenme + toparlanma sistemi oluşturur.

## 🎯 Özellikler

### P0 (MVP)
- ✅ 12 adımlı kişiselleştirme onboarding
- ✅ Kişisel profil ve hedef yönetimi
- ✅ Kişiselleştirilmiş antrenman programı oluşturma
- ✅ Gerçek zamanlı antrenman takibi (set/reps/weight)
- ✅ Beslenme hedefleri ve makro takibi
- ✅ Yemek ekleme ve kalori sayacı
- ✅ Dashboard (günlük özet)
- ✅ Kilo takibi ve grafikler
- ✅ İlerleme grafikleri

### P1
- ✅ Haftalık check-in sistemi
- ✅ AI Koç (doğal dil sohbet)
- ✅ Egzersiz kütüphanesi (50+ egzersiz)
- ✅ Besin veritabanı (40+ gıda)
- ✅ Progress ring ve grafikler
- ✅ Veri kalıcılığı (localStorage)
- ✅ Geri kazanım analizi

### P2 (Yakın gelecek)
- 🔲 Google Health Connect entegrasyonu
- 🔲 Wearables desteği
- 🔲 Gelişmiş AI (LLM entegrasyonu)
- 🔲 Sosyal özellikler
- 🔲 Gamification

## 🏗️ Teknik Mimari

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| State | Zustand (persist middleware) |
| Routing | React Router 7 |
| UI | Tailwind CSS 4 |
| Grafikler | Recharts |
| İkonlar | Lucide React |
| Android | Capacitor 7 |

## 📁 Proje Yapısı

```
fitness-ai/
├── src/
│   ├── components/       # Paylaşılan UI bileşenleri
│   │   ├── ui/          # Button, Card, Input, ProgressRing
│   │   └── BottomNav.tsx
│   ├── pages/           # Sayfa bileşenleri
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Workout.tsx
│   │   ├── ActiveWorkout.tsx
│   │   ├── Nutrition.tsx
│   │   ├── Progress.tsx
│   │   ├── Profile.tsx
│   │   ├── ExerciseLibrary.tsx
│   │   ├── AICoach.tsx
│   │   └── WeeklyCheckin.tsx
│   ├── store/           # Zustand state management
│   │   ├── userStore.ts
│   │   ├── workoutStore.ts
│   │   ├── nutritionStore.ts
│   │   └── progressStore.ts
│   ├── engine/          # Fitness hesaplama motoru
│   │   └── fitness.ts
│   ├── data/            # Statik veriler
│   │   ├── exercises.ts
│   │   └── foods.ts
│   ├── types/           # TypeScript tanımları
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── android/             # Capacitor Android projesi
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Android platformunu ekle
npx cap add android

# Web assets'ları Android'e kopyala
npx cap sync android

# Android Studio'da aç
npx cap open android
```

## 📱 APK Oluşturma

### Yöntem 1: Android Studio ile
```bash
npm run build
npx cap sync android
npx cap open android
# Android Studio'da: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Yöntem 2: Komut satırı ile
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🧮 Fitness Motoru

### BMR Hesaplaması (Mifflin-St Jeor)
- **Erkek:** 10 × kilo + 6.25 × boy - 5 × yaş + 5
- **Kadın:** 10 × kilo + 6.25 × boy - 5 × yaş - 161

### TDEE Hesaplaması
- Sedanter: BMR × 1.2
- Hafif aktif: BMR × 1.375
- Orta aktif: BMR × 1.55
- Çok aktif: BMR × 1.725

### Kalori Hedefleri
- Kilo verme: TDEE × 0.80 (%20 açık)
- Maintenance: TDEE
- Kilo alma: TDEE × 1.15 (%15 fazla)
- Recomposition: TDEE

### Program Seçimi
| Gün Sayısı | Seviye | Program |
|-----------|--------|---------|
| 1-3 | Başlangıç | Full Body |
| 1-3 | Orta/İleri | Upper/Lower |
| 4 | Başlangıç | Full Body |
| 4 | Orta/İleri | Upper/Lower |
| 5 | Orta/İleri | Push/Pull/Legs |
| 6-7 | Her seviye | Hybrid |

## 🍎 Beslenme Sistemi

- Mifflin-St Jeor ile BMR/TDEE hesaplama
- Hedefe göre kalori ve makro belirleme
- Protein: 2g/kg vücut ağırlığı
- Yağ: Kalorinin %25'i
- Karbonhidrat: Kalan kalori
- Güvenlik: Kadınlarda minimum 1200 kcal, erkeklerde 1500 kcal

## 📊 Veri Modeli

- **Users:** Kimlik bilgileri
- **Profiles:** Fiziksel bilgiler, hedefler, tercihler
- **Workout Plans:** Antrenman programları
- **Workout Logs:** Antrenman kayıtları
- **Food Entries:** Yemek kayıtları
- **Weight Logs:** Kilo ölçümleri
- **Measurements:** Vücut ölçümleri
- **Weekly Check-ins:** Haftalık değerlendirmeler

## 🔒 Güvenlik

- Tüm veriler cihazda (localStorage) saklanır
- Veri dışarı gönderilmez
- Kullanıcı yalnızca kendi verilerine erişir
- Sağlık uyarısı: Uygulama tıbbi tavsiye vermez

## 🎨 Tasarım Sistemi

- Koyu tema (dark mode)
- Gradan renkler: Primary (#3b82f6), Accent (#10b981)
- Modern kartlar ve progress ring'ler
- Mobil-öncelikli tasarım
- Büyük dokunma hedefleri (44px minimum)
- Safe area desteği

## ⚠️ Sorumluluk Reddi

Bu uygulama tıbbi tavsiye niteliği taşımaz. Kalori ve makro hesaplamaları tahminidir. Herhangi bir sağlık sorununuz varsa doktorunuza danışın. Uygulama doktor veya diyetisyen değildir.

## 📄 Lisans

MIT License
