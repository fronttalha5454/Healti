/**
 * Additional equipment-free exercises (vücut ağırlığı).
 * formTips = "uygulama adımları": ilk madde başlangıç pozisyonu, sonrakiler hareketin adımları.
 */
import type { Exercise } from '../../../types';

const base = { equipment: ['bodyweight'] as Exercise['equipment'], environment: 'home' as const };

export const HOME_EXERCISES: Exercise[] = [
  {
    id: 'home_wall_push_up', name: 'Duvar Şınavı', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps'],
    difficulty: 'beginner', category: 'compound', ...base,
    formTips: ['Duvardan bir kol boyu uzakta dur, eller omuz hizasında duvarda', 'Vücut baştan topuğa düz kalsın', 'Göğsünü duvara yaklaştır, dirsekler 45° açıda', 'Kontrollü şekilde itip başlangıca dön'],
    description: 'Şınava hazırlık: en hafif itiş hareketi',
  },
  {
    id: 'home_knee_push_up', name: 'Dizüstü Şınav', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'triceps', 'core'],
    difficulty: 'beginner', category: 'compound', ...base,
    formTips: ['Dizler yerde, eller omuzdan biraz geniş', 'Dizden başa düz bir çizgi oluştur', 'Göğüs yere yaklaşana kadar in', 'Yere basarak yukarı it'],
    description: 'Tam şınava geçiş için ara adım',
  },
  {
    id: 'home_superman', name: 'Superman', muscleGroup: 'back', secondaryMuscles: ['glutes', 'hamstrings'],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Yüzüstü uzan, kollar öne uzanık', 'Kol, göğüs ve bacakları aynı anda 5-10 cm kaldır', '2 saniye bekle, boynu nötr tut', 'Yavaşça indir'],
    description: 'Bel ve sırt eksenini güçlendirir, alet gerekmez',
  },
  {
    id: 'home_reverse_snow_angel', name: 'Ters Kar Meleği', muscleGroup: 'back', secondaryMuscles: ['shoulders', 'traps'],
    difficulty: 'intermediate', category: 'isolation', ...base,
    formTips: ['Yüzüstü uzan, kollar yanda, avuç içi yere bakar', 'Göğsü hafifçe kaldır', 'Kolları kavis çizerek başın üstüne getir', 'Aynı yoldan geri dön, omuz bıçaklarını sık'],
    description: 'Üst sırt ve omuz arkası',
  },
  {
    id: 'home_bird_dog', name: 'Bird Dog', muscleGroup: 'core', secondaryMuscles: ['back', 'glutes'],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Dört ayak pozisyonu: eller omuz, dizler kalça altında', 'Sağ kolu ve sol bacağı aynı anda uzat', '2 saniye bekle, kalçayı yana yatırma', 'Yavaşça dön, tarafı değiştir'],
    description: 'Denge ve bel stabilitesi',
  },
  {
    id: 'home_dead_bug', name: 'Dead Bug', muscleGroup: 'core', secondaryMuscles: [],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Sırt üstü yat, kollar tavana, dizler 90° havada', 'Belini yere yapıştır', 'Karşı kol ve bacağı yavaşça uzat', 'Belin kalkmadan başlangıca dön, tarafı değiştir'],
    description: 'Karın derin kasları, bel dostu',
  },
  {
    id: 'home_bicycle_crunch', name: 'Bisiklet Crunch', muscleGroup: 'core', secondaryMuscles: [],
    difficulty: 'intermediate', category: 'isolation', ...base,
    formTips: ['Sırt üstü yat, eller kulak arkasında (boyna çekme)', 'Omuzları yerden kaldır', 'Sağ dirsek sol dize, sonra tersi', 'Yavaş ve kontrollü pedal çevir'],
    description: 'Düz ve yan karın kasları',
  },
  {
    id: 'home_leg_raise', name: 'Yatarak Bacak Kaldırma', muscleGroup: 'core', secondaryMuscles: [],
    difficulty: 'intermediate', category: 'isolation', ...base,
    formTips: ['Sırt üstü yat, eller kalça altında', 'Bacaklar bitişik ve düze yakın', 'Bacakları 90°ye kadar kaldır', 'Yere değdirmeden yavaşça indir'],
    description: 'Alt karın',
  },
  {
    id: 'home_mountain_climber', name: 'Mountain Climber', muscleGroup: 'core', secondaryMuscles: ['shoulders', 'quadriceps'],
    difficulty: 'intermediate', category: 'compound', ...base,
    formTips: ['Şınav pozisyonunda başla, vücut düz', 'Bir dizi göğse çek', 'Hızlıca bacak değiştir', 'Kalçanı yükseltme, nefesini düzenli tut'],
    description: 'Kardiyo + karın',
  },
  {
    id: 'home_jumping_jack', name: 'Jumping Jack', muscleGroup: 'full_body', secondaryMuscles: ['quadriceps', 'shoulders'],
    difficulty: 'beginner', category: 'compound', ...base,
    formTips: ['Ayaklar bitişik, kollar yanda', 'Zıplayarak ayakları aç, kolları başın üstünde birleştir', 'Zıplayarak başlangıca dön', 'Yumuşak bas, dizleri kilitleme'],
    description: 'Isınma ve hafif kardiyo',
  },
  {
    id: 'home_high_knees', name: 'Yüksek Diz Çekişi', muscleGroup: 'full_body', secondaryMuscles: ['quadriceps', 'core'],
    difficulty: 'beginner', category: 'compound', ...base,
    formTips: ['Dik dur, kollar 90° bükülü', 'Yerinde koşar gibi dizleri kalça hizasına çek', 'Parmak ucunda yumuşak bas', 'Tempoyu 30 saniye koru'],
    description: 'Yüksek tempolu kardiyo, zıplama istemeyen düşük etkili sürüm: yürüyerek yapılabilir',
  },
  {
    id: 'home_burpee', name: 'Burpee', muscleGroup: 'full_body', secondaryMuscles: ['chest', 'quadriceps', 'core'],
    difficulty: 'advanced', category: 'compound', ...base,
    formTips: ['Ayakta başla, çömel ve elleri yere koy', 'Ayakları geriye atıp şınav pozisyonuna geç', 'Şınav yap (isteğe bağlı), ayakları ellere çek', 'Zıplayarak kalk, kolları başın üstünde birleştir'],
    description: 'Tüm vücut, yüksek yoğunluk (başlangıçta şınavsız ve zıplamasız yap)',
  },
  {
    id: 'home_pike_hold', name: 'Pike Duruşu', muscleGroup: 'shoulders', secondaryMuscles: ['triceps', 'core'],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Şınav pozisyonundan kalçayı yukarı it, ters V şekli ver', 'Bacaklar düze yakın, kafa kolların arasında', '20-30 saniye bekle', 'Omuzları kulaklardan uzak tut'],
    description: 'Pike push-up öncesi omuz hazırlığı',
  },
  {
    id: 'home_towel_curl', name: 'Havlu ile Biceps Direnci', muscleGroup: 'biceps', secondaryMuscles: ['forearms'],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Ayağını havlunun ortasına koy, uçları ellerinde', 'Dirsekler gövdeye yakın', 'Ayağınla aşağı bastırırken kollarınla yukarı çek', 'Yavaşça bırak'],
    description: 'Biceps için kendi kendine direnç',
  },
  {
    id: 'home_cat_cow', name: 'Kedi-İnek Esnetmesi', muscleGroup: 'back', secondaryMuscles: ['core'],
    difficulty: 'beginner', category: 'isolation', ...base,
    formTips: ['Dört ayak pozisyonu', 'Nefes verirken sırtı yukarı yuvarla', 'Nefes alırken karnı aşağı bırakıp başı kaldır', '10 tekrar yavaş yap'],
    description: 'Omurga mobilitesi, ısınma ve soğuma için',
  },
];
