# Healthi: Canlıya Alma Rehberi

Frontend (Vite + React) **Vercel**'e, backend (`server/`, Express: AI koç proxy'si, push, e-posta) **Render**'a yayınlanır.
Tüm komutlar `zsh` uyumludur. Çok satırlı dosya oluştururken `cat << 'EOF' > dosya` kalıbını kullan.

Backend olmadan da uygulama çalışır: AI koç yerel motora döner, giriş/kayıt Firebase ile çalışır.
Önce frontend'i yayınla, backend'i sonra ekle.

## 1. Repoyu hazırla

```zsh
git clone https://github.com/fronttalha5454/Healti.git
cd Healti
npm ci
npm run typecheck && npm test && npm run build
```

Üç komut da hatasız bitmeli. `.env` dosyası asla commit edilmez (`.gitignore` içinde). Firebase web yapılandırması
`.env.production` içinde zaten hazır (herkese açık olması normaldir).

## 2. Frontend: Vercel

1. https://vercel.com adresinde GitHub ile giriş yap, **Add New → Project → Healti** repoyu seç.
2. Ayarlar `vercel.json` içinde hazır (Framework: Vite, Output: `dist`). Değiştirme.
3. **Environment Variables** bölümüne ekle (backend'i kurduktan sonra):
   - `VITE_AI_API_URL` = `https://healthi-api.onrender.com`
   - `VITE_PUSH_API_URL` = `https://healthi-api.onrender.com`
4. **Deploy**'a bas. Adres `https://healti-xxxx.vercel.app` gibi olur. Bu adresi not et (CORS için lazım).

Komut satırından istersen:

```zsh
npm i -g vercel
vercel login
vercel --prod
```

## 3. Firebase: yetkili alan adı (giriş için şart)

Firebase Console → **Authentication → Settings → Authorized domains → Add domain** ve Vercel adresini ekle
(`healti-xxxx.vercel.app`). Eklemezsen canlı sitede giriş çalışmaz.

## 4. Backend: Render

1. https://render.com → **New → Blueprint** → Healti reposunu seç. `render.yaml` servisi otomatik tanımlar (`rootDir: server`).
2. Sorulan gizli değerleri gir:
   - `CORS_ORIGINS` = Vercel adresin, örn. `https://healti-xxxx.vercel.app` (birden fazlaysa virgülle ayır, sonda `/` olmasın)
   - `ANTHROPIC_API_KEY` = https://console.anthropic.com/settings/keys adresinden aldığın anahtar
   - `RESEND_API_KEY` = (isteğe bağlı) e-posta için
   - `APP_URL` = Vercel adresin
3. Deploy bitince kontrol et:

```zsh
curl https://healthi-api.onrender.com/api/health
```

`"status":"ok"` ve anahtar girdiysen `"ai":true` görmelisin. Render servis adını farklı verdiysen adresi ona göre değiştir
ve Vercel'deki `VITE_*` değerlerini güncelleyip **Redeploy** yap.

> Ücretsiz Render planı 15 dk boşta kalınca uyur; ilk istek ~30 sn sürebilir. AI koç bu durumda yerel motora düşer.

## 5. Android APK

`master`'a her birleştirmede GitHub Actions bir debug APK üretip **Releases** sayfasına koyar.
Telefonda APK'yi indirip kur. Uygulama adı **Healthi**. Kimlik (`com.fitnessai.coach`) bilerek değiştirilmedi;
değiştirirsen Firebase Android uygulamasını da yeniden kaydetmen gerekir.

## 6. Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| Siyah ekran | F12 → Console'daki ilk kırmızı hata. Ekranda hata kutusu veya "Bir şeyler yanlış gitti" görünür. `contentscript.js` uyarıları tarayıcı eklentisinden gelir, uygulamayla ilgisi yoktur. |
| `blocks the use of eval` | Eklenti kaynaklıdır. Gizli pencerede dene. Uygulama kodunda `eval` yok. |
| Canlıda giriş yapılamıyor | Firebase → Authorized domains'e Vercel adresini ekle (3. adım). |
| `CORS` hatası | Render'da `CORS_ORIGINS` tam Vercel adresiyle eşleşmeli (`https://` ile, sonda `/` olmadan). |
| Sayfa yenileyince 404 | `vercel.json` içindeki `rewrites` bunu çözer; dosyanın repoda olduğundan emin ol. |
