# Android SDK Kurulum Rehberi - Fitness AI

Bu rehber, yerel bilgisayarınızda Android SDK kurarak uygulamayı USB ile telefona kurmanızı sağlar.

---

## 1. Ön Gereksinimler

| Gereksinim | Açıklama |
|-----------|----------|
| **Java 17+** | Android Gradle Plugin 8.x gerektirir |
| **Node.js 18+** | Capacitor ve web assets için |
| **USB Kablo** | Telefonunuzu bilgisayara bağlayın |

### Java Kontrolü
```bash
java -version
# OpenJDK 17 veya üzeri olmalı
```

---

## 2. Android Studio Kurulumu

En kolay yol Android Studio kurmaktır — tüm SDK araçlarını otomatik yükler.

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install wget unzip

# Android Studio indir
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.2.2.13/android-studio-2024.2.2.13-linux.tar.gz

# Çıkart ve kur
tar -xzf android-studio-2024.2.2.13-linux.tar.gz
sudo mv android-studio /opt/

# Çalıştır
/opt/android-studio/bin/studio.sh
```

### macOS
```bash
# Homebrew ile
brew install --cask android-studio

# veya Manuel: https://developer.android.com/studio#downloads
```

### Windows
1. https://developer.android.com/studio adresinden indirin
2. `.exe` dosyasını çalıştırın
3. Kurulum sihirbazını takip edin

---

## 3. SDK Araçlarını Kurun (adb dahil)

Android Studio açıldıktan sonra:

1. **SDK Manager** → `Tools → SDK Manager`
2. Şunları işaretleyin:
   - ✅ Android SDK Platform (en son sürüm)
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools (adb burada)
   - ✅ Android SDK Command-line Tools
3. **Apply** → İndirmeyi bekleyin

### veya Komut Satırından (sdkmanager)
```bash
# Android SDK Command-line Tools'u indirin
# https://developer.android.com/studio#command-line-tools-only

# SDK Manager'ı çalıştırın
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

---

## 4. Ortam Değişkenlerini Ayarlayın

### Linux / macOS
`~/.bashrc` veya `~/.zshrc` dosyasına ekleyin:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Uygulamak için:
```bash
source ~/.bashrc
```

### Windows
```
1. Sistem Özellikleri → Gelişmiş Sistem Ayarları
2. Ortam Değişkenleri
3. Yeni değişken ekle:
   - Değişken adı: ANDROID_HOME
   - Değer: C:\Users\KULLANICI\AppData\Local\Android\Sdk
4. PATH'e ekle: %ANDROID_HOME%\platform-tools
```

### Doğrulama
```bash
adb version
# Android Debug Bridge version 1.0.xx
```

---

## 5. Telefonda USB Hata Ayıklamayı Açın

1. **Ayarlar → Hakkında Telefon** → `Yapı Numarası`'na 7 kez tıklayın
2. **Ayarlar → Geliştirici Seçenekleri** açılır
3. **USB Hata Ayıklama** → Açın
4. Telefonda "Bu bilgisayara güven" → **Tamam**

---

## 6. Telefona Bağlanın

```bash
# Cihazların listesini görün
adb devices
# List of devices attached
# XXXXXXXX    device    ← bu görünmeli
```

Eğer `unauthorized` görünürse, telefondaki "Bu bilgisayara güven" bildirimini onaylayın.

---

## 7. Uygulamayı Kurun ve Çalıştırın

### Debug APK (geliştirme)
```bash
cd fitness-ai/android

# Build et
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleDebug

# Telefona kur
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Çalıştır
adb shell am start -n com.fitnessai.coach/.MainActivity
```

### Release APK (imzalı)
```bash
cd fitness-ai/android

# Build et
./gradlew assembleRelease

# Telefona kur
adb install -r app/build/outputs/apk/release/app-release.apk

# Çalıştır
adb shell am start -n com.fitnessai.coach/.MainActivity
```

### Tek Komut ile (Capacitor)
```bash
cd fitness-ai
npx cap run android
```
> Bu komut otomatik build eder, kurar ve çalıştırır.

---

## 8. Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `adb devices` boş liste | USB kablo veya sürücü kontrol |
| `unauthorized` | Telefondaki güven bildirimini onaylayın |
| `JAVA_HOME not set` | `export JAVA_HOME=/path/to/jdk` |
| `SDK location not found` | `local.properties` dosyasında `sdk.dir` yolu doğru mu? |
| Gradle hatası | `./gradlew clean`然后tekrar deneyin |
| Phone not detected | Telefonda USB Modu: Dosya Aktarımı (MTP) seçin |

---

## Özet Komutlar

```bash
# Tüm süreci tek seferde çalıştırın:
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
cd fitness-ai
npx cap sync android
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.fitnessai.coach/.MainActivity
```

---

*Bu rehber Codebuff ile oluşturulmuştur.* 🤖
