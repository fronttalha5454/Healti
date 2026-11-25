export interface Food {
  id: string;
  name: string;
  nameTr: string;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'snack' | 'beverage';
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  commonPortions: { name: string; grams: number }[];
  isCustom?: boolean;
}

export const FOODS: Food[] = [
  // ═══════════════════════════════════════
  // PROTEIN
  // ═══════════════════════════════════════
  { id: 'chicken_breast', name: 'Chicken Breast', nameTr: 'Tavuk Göğsü', category: 'protein', per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }, { name: '1 dilim', grams: 120 }] },
  { id: 'chicken_thigh', name: 'Chicken Thigh', nameTr: 'Tavuk But', category: 'protein', per100g: { calories: 209, protein: 26, carbs: 0, fat: 10.9 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'chicken_wing', name: 'Chicken Wing', nameTr: 'Tavuk Kanat', category: 'protein', per100g: { calories: 239, protein: 18, carbs: 0, fat: 18 }, commonPortions: [{ name: '6 adet', grams: 120 }] },
  { id: 'egg', name: 'Egg', nameTr: 'Yumurta', category: 'protein', per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 }, commonPortions: [{ name: '1 adet', grams: 50 }, { name: '2 adet', grams: 100 }] },
  { id: 'tuna', name: 'Tuna', nameTr: 'Ton Balığı', category: 'protein', per100g: { calories: 132, protein: 28, carbs: 0, fat: 1.3 }, commonPortions: [{ name: '1 kutu', grams: 80 }, { name: '1 porsiyon', grams: 100 }] },
  { id: 'beef', name: 'Beef', nameTr: 'Sığır Eti', category: 'protein', per100g: { calories: 250, protein: 26, carbs: 0, fat: 15 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'beef_lean', name: 'Lean Beef', nameTr: 'Dana Bonfile', category: 'protein', per100g: { calories: 187, protein: 28, carbs: 0, fat: 8 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'lamb', name: 'Lamb', nameTr: 'Kuzu Eti', category: 'protein', per100g: { calories: 294, protein: 25, carbs: 0, fat: 21 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'fish', name: 'White Fish', nameTr: 'Beyaz Balık', category: 'protein', per100g: { calories: 96, protein: 20, carbs: 0, fat: 1.5 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'salmon', name: 'Salmon', nameTr: 'Somon', category: 'protein', per100g: { calories: 208, protein: 20, carbs: 0, fat: 13 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'shrimp', name: 'Shrimp', nameTr: 'Karides', category: 'protein', per100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'whey_protein', name: 'Whey Protein', nameTr: 'Protein Tozu', category: 'protein', per100g: { calories: 375, protein: 80, carbs: 8, fat: 3 }, commonPortions: [{ name: '1 ölçek', grams: 30 }] },

  // ═══════════════════════════════════════
  // TÜRK YEMEKLERİ
  // ═══════════════════════════════════════
  { id: 'doner', name: 'Döner Kebab', nameTr: 'Döner', category: 'protein', per100g: { calories: 234, protein: 18, carbs: 3, fat: 16 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }, { name: '1 dürüm', grams: 250 }] },
  { id: 'iskender', name: 'İskender Kebab', nameTr: 'İskender', category: 'protein', per100g: { calories: 198, protein: 16, carbs: 8, fat: 12 }, commonPortions: [{ name: '1 porsiyon', grams: 350 }] },
  { id: 'adana_kebab', name: 'Adana Kebab', nameTr: 'Adana Kebap', category: 'protein', per100g: { calories: 265, protein: 20, carbs: 2, fat: 19 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'urfa_kebab', name: 'Urfa Kebab', nameTr: 'Urfa Kebap', category: 'protein', per100g: { calories: 245, protein: 19, carbs: 2, fat: 17 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'tavuk_doner', name: 'Chicken Döner', nameTr: 'Tavuk Döner', category: 'protein', per100g: { calories: 196, protein: 22, carbs: 3, fat: 10 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }, { name: '1 dürüm', grams: 250 }] },
  { id: 'lahmacun', name: 'Lahmacun', nameTr: 'Lahmacun', category: 'carb', per100g: { calories: 218, protein: 11, carbs: 25, fat: 8 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'pide', name: 'Turkish Pide', nameTr: 'Pide', category: 'carb', per100g: { calories: 235, protein: 10, carbs: 30, fat: 8 }, commonPortions: [{ name: '1 pide', grams: 300 }] },
  { id: 'lahmacun_pide', name: 'Kıymalı Pide', nameTr: 'Kıymalı Pide', category: 'carb', per100g: { calories: 242, protein: 12, carbs: 28, fat: 9 }, commonPortions: [{ name: '1 pide', grams: 280 }] },
  { id: 'mantı', name: 'Turkish Ravioli', nameTr: 'Mantı', category: 'carb', per100g: { calories: 165, protein: 8, carbs: 22, fat: 5 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'kofte', name: 'Meatball', nameTr: 'Köfte', category: 'protein', per100g: { calories: 256, protein: 18, carbs: 4, fat: 18 }, commonPortions: [{ name: '4 adet', grams: 160 }, { name: '1 porsiyon', grams: 200 }] },
  { id: 'tavuk_sis', name: 'Chicken Shish', nameTr: 'Tavuk Şiş', category: 'protein', per100g: { calories: 185, protein: 24, carbs: 2, fat: 9 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'balik_ekmek', name: 'Fish Sandwich', nameTr: 'Balık Ekmek', category: 'protein', per100g: { calories: 178, protein: 14, carbs: 20, fat: 5 }, commonPortions: [{ name: '1 adet', grams: 250 }] },
  { id: 'tantuni', name: 'Tantuni', nameTr: 'Tantuni', category: 'protein', per100g: { calories: 225, protein: 16, carbs: 18, fat: 10 }, commonPortions: [{ name: '1 dürüm', grams: 200 }] },
  { id: 'kokorec', name: 'Kokoreç', nameTr: 'Kokoreç', category: 'protein', per100g: { calories: 268, protein: 14, carbs: 2, fat: 22 }, commonPortions: [{ name: '1 ekmek', grams: 200 }] },
  { id: 'midye_dolu', name: 'Stuffed Mussels', nameTr: 'Midye Dolma', category: 'carb', per100g: { calories: 165, protein: 8, carbs: 22, fat: 5 }, commonPortions: [{ name: '6 adet', grams: 180 }] },
  { id: 'cig_kofte', name: 'Raw Meatball', nameTr: 'Çiğ Köfte', category: 'carb', per100g: { calories: 178, protein: 7, carbs: 28, fat: 4 }, commonPortions: [{ name: '1 dürüm', grams: 150 }] },
  { id: 'pide_ekmek', name: 'Pide Bread', nameTr: 'Pide Ekmeği', category: 'carb', per100g: { calories: 250, protein: 8, carbs: 48, fat: 2.5 }, commonPortions: [{ name: '1/2 pide', grams: 150 }] },

  // Çorbalar
  { id: 'lentil_soup', name: 'Lentil Soup', nameTr: 'Mercimek Çorbası', category: 'carb', per100g: { calories: 65, protein: 4, carbs: 10, fat: 1 }, commonPortions: [{ name: '1 kase', grams: 300 }] },
  { id: 'ezogelin', name: 'Ezogelin Soup', nameTr: 'Ezogelin Çorbası', category: 'carb', per100g: { calories: 58, protein: 3, carbs: 9, fat: 1.2 }, commonPortions: [{ name: '1 kase', grams: 300 }] },
  { id: 'yayla_soup', name: 'Yogurt Soup', nameTr: 'Yayla Çorbası', category: 'dairy', per100g: { calories: 45, protein: 3, carbs: 5, fat: 1.5 }, commonPortions: [{ name: '1 kase', grams: 300 }] },
  { id: 'tomato_soup', name: 'Tomato Soup', nameTr: 'Domates Çorbası', category: 'vegetable', per100g: { calories: 38, protein: 1.5, carbs: 6, fat: 1 }, commonPortions: [{ name: '1 kase', grams: 300 }] },
  { id: 'tarhana_soup', name: 'Tarhana Soup', nameTr: 'Tarhana Çorbası', category: 'carb', per100g: { calories: 52, protein: 2.5, carbs: 8, fat: 1.2 }, commonPortions: [{ name: '1 kase', grams: 300 }] },

  // Ana Yemekler
  { id: 'kuru_fasulye', name: 'White Bean Stew', nameTr: 'Kuru Fasulye', category: 'carb', per100g: { calories: 139, protein: 9, carbs: 25, fat: 0.4 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'nohut', name: 'Chickpeas', nameTr: 'Nohut', category: 'carb', per100g: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'kelem', name: 'Braised Cabbage', nameTr: 'Kapuska', category: 'vegetable', per100g: { calories: 68, protein: 3, carbs: 8, fat: 3 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'turlu', name: 'Mixed Vegetable Stew', nameTr: 'Türlü', category: 'vegetable', per100g: { calories: 72, protein: 3, carbs: 10, fat: 2.5 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'imam_bayildi', name: 'Stuffed Eggplant', nameTr: 'İmam Bayıldı', category: 'vegetable', per100g: { calories: 98, protein: 2, carbs: 8, fat: 7 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'karnıyarık', name: 'Split Eggplant', nameTr: 'Karnıyarık', category: 'vegetable', per100g: { calories: 118, protein: 4, carbs: 10, fat: 7 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'tavuk_sote', name: 'Chicken Sauté', nameTr: 'Tavuk Sote', category: 'protein', per100g: { calories: 156, protein: 18, carbs: 4, fat: 7 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'izmir_kofte', name: 'İzmir Meatball', nameTr: 'İzmir Köfte', category: 'protein', per100g: { calories: 165, protein: 14, carbs: 10, fat: 8 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },

  // Pilavlar
  { id: 'rice', name: 'White Rice', nameTr: 'Beyaz Pirinç', category: 'carb', per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }, { name: '1 bardak', grams: 185 }] },
  { id: 'bulgur_pilavi', name: 'Bulgur Pilaf', nameTr: 'Bulgur Pilavı', category: 'carb', per100g: { calories: 128, protein: 4, carbs: 24, fat: 2 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'noodle_pilav', name: 'Noodle Rice', nameTr: 'Şehriyeli Pirinç', category: 'carb', per100g: { calories: 135, protein: 3, carbs: 27, fat: 1.5 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'pilav', name: 'Turkish Rice', nameTr: 'Türk Pirinç Pilavı', category: 'carb', per100g: { calories: 132, protein: 2.8, carbs: 26, fat: 2 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },

  // Salatalar
  { id: 'cobb_salad', name: 'Çoban Salatası', nameTr: 'Çoban Salatası', category: 'vegetable', per100g: { calories: 28, protein: 1, carbs: 4, fat: 1 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'ezme', name: 'Tomato Pepper Dip', nameTr: 'Ezme', category: 'vegetable', per100g: { calories: 42, protein: 1.5, carbs: 6, fat: 1.5 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'piyaz', name: 'Bean Salad', nameTr: 'Piyaz', category: 'carb', per100g: { calories: 85, protein: 5, carbs: 12, fat: 2 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'gavur_dagi', name: 'Dried Tomato Salad', nameTr: 'Gavur Dağı Salatası', category: 'vegetable', per100g: { calories: 52, protein: 1.5, carbs: 5, fat: 3 }, commonPortions: [{ name: '1 porsiyon', grams: 120 }] },

  //额外 Turkish dishes
  { id: 'menemen', name: 'Menemen', nameTr: 'Menemen', category: 'protein', per100g: { calories: 95, protein: 6, carbs: 5, fat: 6 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'gozleme', name: 'Gözleme', nameTr: 'Gözleme', category: 'carb', per100g: { calories: 230, protein: 8, carbs: 32, fat: 8 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'zeytinyagli_yemek', name: 'Olive Oil Dish', nameTr: 'Zeytinyağlı Yemek', category: 'vegetable', per100g: { calories: 110, protein: 2, carbs: 8, fat: 8 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },

  // ═══════════════════════════════════════
  // KARBONHİDRAT
  // ═══════════════════════════════════════
  { id: 'brown_rice', name: 'Brown Rice', nameTr: 'Kahverengi Pirinç', category: 'carb', per100g: { calories: 112, protein: 2.6, carbs: 24, fat: 0.9 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'pasta', name: 'Pasta', nameTr: 'Makarna', category: 'carb', per100g: { calories: 131, protein: 5, carbs: 25, fat: 1.1 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'bread', name: 'White Bread', nameTr: 'Beyaz Ekmek', category: 'carb', per100g: { calories: 265, protein: 9, carbs: 49, fat: 3.2 }, commonPortions: [{ name: '1 dilim', grams: 30 }, { name: '2 dilim', grams: 60 }] },
  { id: 'whole_wheat_bread', name: 'Whole Wheat Bread', nameTr: 'Tam Buğday Ekmeği', category: 'carb', per100g: { calories: 247, protein: 13, carbs: 41, fat: 3.4 }, commonPortions: [{ name: '1 dilim', grams: 35 }] },
  { id: 'oats', name: 'Oats', nameTr: 'Yulaf', category: 'carb', per100g: { calories: 389, protein: 17, carbs: 66, fat: 7 }, commonPortions: [{ name: '1 bardak', grams: 80 }, { name: '1 kase', grams: 100 }] },
  { id: 'sweet_potato', name: 'Sweet Potato', nameTr: 'Tatlı Patates', category: 'carb', per100g: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'potato', name: 'Potato', nameTr: 'Patates', category: 'carb', per100g: { calories: 77, protein: 2, carbs: 17, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'bulgur', name: 'Bulgur', nameTr: 'Bulgur', category: 'carb', per100g: { calories: 83, protein: 3.1, carbs: 19, fat: 0.2 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'quinoa', name: 'Quinoa', nameTr: 'Kinoa', category: 'carb', per100g: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'couscous', name: 'Couscous', nameTr: 'Kuskus', category: 'carb', per100g: { calories: 112, protein: 3.8, carbs: 23, fat: 0.2 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'corn', name: 'Corn', nameTr: 'Mısır', category: 'carb', per100g: { calories: 86, protein: 3.2, carbs: 19, fat: 1.2 }, commonPortions: [{ name: '1 mısır', grams: 150 }] },
  { id: 'honey', name: 'Honey', nameTr: 'Bal', category: 'carb', per100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 21 }] },

  // ═══════════════════════════════════════
  // YAĞLAR
  // ═══════════════════════════════════════
  { id: 'olive_oil', name: 'Olive Oil', nameTr: 'Zeytinyağı', category: 'fat', per100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 15 }] },
  { id: 'avocado', name: 'Avocado', nameTr: 'Avokado', category: 'fat', per100g: { calories: 160, protein: 2, carbs: 9, fat: 15 }, commonPortions: [{ name: '1/2 adet', grams: 100 }, { name: '1 adet', grams: 200 }] },
  { id: 'almonds', name: 'Almonds', nameTr: 'Badem', category: 'fat', per100g: { calories: 579, protein: 21, carbs: 22, fat: 50 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },
  { id: 'peanut_butter', name: 'Peanut Butter', nameTr: 'Fıstık Ezmesi', category: 'fat', per100g: { calories: 588, protein: 25, carbs: 20, fat: 50 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 32 }] },
  { id: 'walnut', name: 'Walnut', nameTr: 'Ceviz', category: 'fat', per100g: { calories: 654, protein: 15, carbs: 14, fat: 65 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },
  { id: 'hazelnut', name: 'Hazelnut', nameTr: 'Fındık', category: 'fat', per100g: { calories: 628, protein: 15, carbs: 17, fat: 61 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },
  { id: 'pistachio', name: 'Pistachio', nameTr: 'Antep Fıstığı', category: 'fat', per100g: { calories: 560, protein: 20, carbs: 27, fat: 45 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },
  { id: 'sunflower_seed', name: 'Sunflower Seed', nameTr: 'Ayçiçeği Çekirdeği', category: 'fat', per100g: { calories: 584, protein: 21, carbs: 20, fat: 51 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },
  { id: 'tahini', name: 'Tahini', nameTr: 'Tahin', category: 'fat', per100g: { calories: 595, protein: 17, carbs: 21, fat: 54 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 15 }] },

  // ═══════════════════════════════════════
  // SEBZELER
  // ═══════════════════════════════════════
  { id: 'broccoli', name: 'Broccoli', nameTr: 'Brokoli', category: 'vegetable', per100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'spinach', name: 'Spinach', nameTr: 'Ispanak', category: 'vegetable', per100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'tomato', name: 'Tomato', nameTr: 'Domates', category: 'vegetable', per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'cucumber', name: 'Cucumber', nameTr: 'Salatalık', category: 'vegetable', per100g: { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'lettuce', name: 'Lettuce', nameTr: 'Marul', category: 'vegetable', per100g: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'carrot', name: 'Carrot', nameTr: 'Havuç', category: 'vegetable', per100g: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 }, commonPortions: [{ name: '1 adet', grams: 100 }] },
  { id: 'onion', name: 'Onion', nameTr: 'Soğan', category: 'vegetable', per100g: { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 110 }] },
  { id: 'pepper', name: 'Bell Pepper', nameTr: 'Biber', category: 'vegetable', per100g: { calories: 31, protein: 1, carbs: 6, fat: 0.3 }, commonPortions: [{ name: '1 adet', grams: 120 }] },
  { id: 'zucchini', name: 'Zucchini', nameTr: 'Kabak', category: 'vegetable', per100g: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'eggplant', name: 'Eggplant', nameTr: 'Patlıcan', category: 'vegetable', per100g: { calories: 25, protein: 1, carbs: 6, fat: 0.2 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'mushroom', name: 'Mushroom', nameTr: 'Mantar', category: 'vegetable', per100g: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'cauliflower', name: 'Cauliflower', nameTr: 'Karnabahar', category: 'vegetable', per100g: { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'green_beans', name: 'Green Beans', nameTr: 'Taze Fasulye', category: 'vegetable', per100g: { calories: 31, protein: 1.8, carbs: 7, fat: 0.1 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'artichoke', name: 'Artichoke', nameTr: 'Enginar', category: 'vegetable', per100g: { calories: 47, protein: 3.3, carbs: 11, fat: 0.2 }, commonPortions: [{ name: '1 adet', grams: 120 }] },

  // ═══════════════════════════════════════
  // MEYVELER
  // ═══════════════════════════════════════
  { id: 'banana', name: 'Banana', nameTr: 'Muz', category: 'fruit', per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }, commonPortions: [{ name: '1 adet', grams: 120 }, { name: '1 orta', grams: 118 }] },
  { id: 'apple', name: 'Apple', nameTr: 'Elma', category: 'fruit', per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }, commonPortions: [{ name: '1 adet', grams: 180 }] },
  { id: 'orange', name: 'Orange', nameTr: 'Portakal', category: 'fruit', per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'strawberry', name: 'Strawberry', nameTr: 'Çilek', category: 'fruit', per100g: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'grapes', name: 'Grapes', nameTr: 'Üzüm', category: 'fruit', per100g: { calories: 69, protein: 0.7, carbs: 18, fat: 0.2 }, commonPortions: [{ name: '1 avuç', grams: 100 }] },
  { id: 'watermelon', name: 'Watermelon', nameTr: 'Karpuz', category: 'fruit', per100g: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 }, commonPortions: [{ name: '1 dilim', grams: 300 }] },
  { id: 'melon', name: 'Melon', nameTr: 'Kavun', category: 'fruit', per100g: { calories: 34, protein: 0.8, carbs: 8, fat: 0.2 }, commonPortions: [{ name: '1 dilim', grams: 200 }] },
  { id: 'peach', name: 'Peach', nameTr: 'Şeftali', category: 'fruit', per100g: { calories: 39, protein: 0.9, carbs: 10, fat: 0.3 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'pear', name: 'Pear', nameTr: 'Armut', category: 'fruit', per100g: { calories: 57, protein: 0.4, carbs: 15, fat: 0.1 }, commonPortions: [{ name: '1 adet', grams: 170 }] },
  { id: 'cherry', name: 'Cherry', nameTr: 'Kiraz', category: 'fruit', per100g: { calories: 50, protein: 1, carbs: 12, fat: 0.3 }, commonPortions: [{ name: '1 avuç', grams: 100 }] },
  { id: 'plum', name: 'Plum', nameTr: 'Erik', category: 'fruit', per100g: { calories: 46, protein: 0.7, carbs: 11, fat: 0.3 }, commonPortions: [{ name: '1 adet', grams: 70 }] },
  { id: 'fig', name: 'Fig', nameTr: 'İncir', category: 'fruit', per100g: { calories: 74, protein: 0.8, carbs: 19, fat: 0.3 }, commonPortions: [{ name: '2 adet taze', grams: 100 }, { name: '3 adet kuru', grams: 40 }] },
  { id: 'pomegranate', name: 'Pomegranate', nameTr: 'Nar', category: 'fruit', per100g: { calories: 83, protein: 1.7, carbs: 19, fat: 1.2 }, commonPortions: [{ name: '1 adet', grams: 200 }] },
  { id: 'kiwi', name: 'Kiwi', nameTr: 'Kivi', category: 'fruit', per100g: { calories: 61, protein: 1.1, carbs: 15, fat: 0.5 }, commonPortions: [{ name: '1 adet', grams: 75 }] },
  { id: 'mango', name: 'Mango', nameTr: 'Mango', category: 'fruit', per100g: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 }, commonPortions: [{ name: '1/2 adet', grams: 150 }] },
  { id: 'pineapple', name: 'Pineapple', nameTr: 'Ananas', category: 'fruit', per100g: { calories: 50, protein: 0.5, carbs: 13, fat: 0.1 }, commonPortions: [{ name: '1 dilim', grams: 150 }] },
  { id: 'blueberry', name: 'Blueberry', nameTr: 'Yaban Mersini', category: 'fruit', per100g: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'raspberry', name: 'Raspberry', nameTr: 'Ahududu', category: 'fruit', per100g: { calories: 52, protein: 1.2, carbs: 12, fat: 0.7 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'lemon', name: 'Lemon', nameTr: 'Limon', category: 'fruit', per100g: { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 }, commonPortions: [{ name: '1/2 adet', grams: 30 }] },
  { id: 'dried_apricot', name: 'Dried Apricot', nameTr: 'Kayısı', category: 'fruit', per100g: { calories: 241, protein: 3.4, carbs: 63, fat: 0.5 }, commonPortions: [{ name: '5 adet', grams: 30 }] },
  { id: 'dried_fig', name: 'Dried Fig', nameTr: 'Kuru İncir', category: 'fruit', per100g: { calories: 249, protein: 3.3, carbs: 64, fat: 0.9 }, commonPortions: [{ name: '2 adet', grams: 30 }] },
  { id: 'dried_date', name: 'Date', nameTr: 'Hurma', category: 'fruit', per100g: { calories: 277, protein: 1.8, carbs: 75, fat: 0.2 }, commonPortions: [{ name: '3 adet', grams: 30 }] },
  { id: 'raisins', name: 'Raisins', nameTr: 'Kuru Üzüm', category: 'fruit', per100g: { calories: 299, protein: 3.1, carbs: 79, fat: 0.5 }, commonPortions: [{ name: '1 avuç', grams: 30 }] },

  // ═══════════════════════════════════════
  // SÜT ÜRÜNLERİ
  // ═══════════════════════════════════════
  { id: 'cottage_cheese', name: 'Cottage Cheese', nameTr: 'Lor Peyniri', category: 'dairy', per100g: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3 }, commonPortions: [{ name: '1 kase', grams: 150 }] },
  { id: 'greek_yogurt', name: 'Greek Yogurt', nameTr: 'Yoğurt', category: 'dairy', per100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.7 }, commonPortions: [{ name: '1 kase', grams: 200 }, { name: '1 bardak', grams: 150 }] },
  { id: 'ayran', name: 'Ayran', nameTr: 'Ayran', category: 'dairy', per100g: { calories: 38, protein: 3.3, carbs: 4.4, fat: 1.2 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'cheese', name: 'White Cheese', nameTr: 'Beyaz Peynir', category: 'dairy', per100g: { calories: 264, protein: 18, carbs: 3.5, fat: 20 }, commonPortions: [{ name: '1 dilim', grams: 30 }, { name: '1 porsiyon', grams: 50 }] },
  { id: 'kashkaval', name: 'Kashkaval Cheese', nameTr: 'Kaşar Peyniri', category: 'dairy', per100g: { calories: 320, protein: 25, carbs: 2, fat: 24 }, commonPortions: [{ name: '1 dilim', grams: 30 }] },
  { id: 'milk', name: 'Milk', nameTr: 'Süt', category: 'dairy', per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'butter', name: 'Butter', nameTr: 'Tereyağı', category: 'dairy', per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 15 }] },
  { id: 'ice_cream', name: 'Ice Cream', nameTr: 'Dondurma', category: 'dairy', per100g: { calories: 207, protein: 3.5, carbs: 24, fat: 11 }, commonPortions: [{ name: '1 top', grams: 80 }] },
  { id: 'string_cheese', name: 'String Cheese', nameTr: 'Tel Peynir', category: 'dairy', per100g: { calories: 290, protein: 22, carbs: 3, fat: 21 }, commonPortions: [{ name: '1 çubuk', grams: 28 }] },

  // ═══════════════════════════════════════
  // ATIŞTIRMALIKLAR (SNACKS)
  // ═══════════════════════════════════════
  { id: 'protein_bar', name: 'Protein Bar', nameTr: 'Protein Bar', category: 'snack', per100g: { calories: 350, protein: 30, carbs: 35, fat: 10 }, commonPortions: [{ name: '1 adet', grams: 60 }] },
  { id: 'dried_fruit', name: 'Dried Fruit Mix', nameTr: 'Kuru Meyve Karışımı', category: 'snack', per100g: { calories: 300, protein: 3, carbs: 70, fat: 1 }, commonPortions: [{ name: '1 avuç', grams: 40 }] },
  { id: 'dark_chocolate', name: 'Dark Chocolate', nameTr: 'Bitter Çikolata', category: 'snack', per100g: { calories: 546, protein: 5, carbs: 60, fat: 31 }, commonPortions: [{ name: '2 kare', grams: 20 }] },
  { id: 'milk_chocolate', name: 'Milk Chocolate', nameTr: 'Sütlü Çikolata', category: 'snack', per100g: { calories: 535, protein: 7.5, carbs: 59, fat: 30 }, commonPortions: [{ name: '2 kare', grams: 20 }] },
  { id: 'hazelnut_spread', name: 'Hazelnut Spread', nameTr: 'Fındık Ezmesi', category: 'snack', per100g: { calories: 539, protein: 6, carbs: 57, fat: 31 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 20 }] },
  { id: 'popcorn', name: 'Popcorn', nameTr: 'Patlamış Mısır', category: 'snack', per100g: { calories: 375, protein: 11, carbs: 74, fat: 4.5 }, commonPortions: [{ name: '1 kase', grams: 30 }] },
  { id: 'granola', name: 'Granola', nameTr: 'Granola', category: 'snack', per100g: { calories: 471, protein: 15, carbs: 64, fat: 20 }, commonPortions: [{ name: '1 bardak', grams: 60 }] },
  { id: 'rice_cake', name: 'Rice Cake', nameTr: 'Pirinç Patlağı', category: 'snack', per100g: { calories: 387, protein: 8, carbs: 81, fat: 3 }, commonPortions: [{ name: '2 adet', grams: 18 }] },
  { id: 'crackers', name: 'Crackers', nameTr: 'Bisküvi', category: 'snack', per100g: { calories: 420, protein: 7, carbs: 68, fat: 14 }, commonPortions: [{ name: '4 adet', grams: 30 }] },
  { id: 'chips', name: 'Potato Chips', nameTr: 'Patates Cipsi', category: 'snack', per100g: { calories: 536, protein: 7, carbs: 53, fat: 35 }, commonPortions: [{ name: '1 paket', grams: 50 }] },
  { id: 'turkish_delight', name: 'Turkish Delight', nameTr: 'Lokum', category: 'snack', per100g: { calories: 325, protein: 0, carbs: 80, fat: 0.2 }, commonPortions: [{ name: '3-4 adet', grams: 40 }] },
  { id: 'halva', name: 'Halva', nameTr: 'Helva', category: 'snack', per100g: { calories: 523, protein: 12, carbs: 54, fat: 30 }, commonPortions: [{ name: '1 dilim', grams: 40 }] },
  { id: 'simit', name: 'Simit', nameTr: 'Simit', category: 'snack', per100g: { calories: 275, protein: 9, carbs: 50, fat: 4 }, commonPortions: [{ name: '1 adet', grams: 120 }] },
  { id: 'poğaça', name: 'Turkish Pastry', nameTr: 'Poğaça', category: 'snack', per100g: { calories: 310, protein: 8, carbs: 38, fat: 14 }, commonPortions: [{ name: '1 adet', grams: 60 }] },
  { id: 'börek', name: 'Turkish Börek', nameTr: 'Börek', category: 'snack', per100g: { calories: 285, protein: 9, carbs: 28, fat: 16 }, commonPortions: [{ name: '1 dilim', grams: 100 }] },
  { id: 'müsli', name: 'Muesli', nameTr: 'Müsli', category: 'snack', per100g: { calories: 357, protein: 10, carbs: 66, fat: 6 }, commonPortions: [{ name: '1 bardak', grams: 60 }] },
  { id: 'energy_ball', name: 'Energy Ball', nameTr: 'Enerji Topu', category: 'snack', per100g: { calories: 400, protein: 12, carbs: 45, fat: 20 }, commonPortions: [{ name: '1 adet', grams: 35 }] },
  { id: 'yogurt_with_granola', name: 'Yogurt with Granola', nameTr: 'Yoğurt ve Granola', category: 'snack', per100g: { calories: 120, protein: 6, carbs: 15, fat: 4 }, commonPortions: [{ name: '1 kase', grams: 250 }] },
  { id: 'fruit_smoothie', name: 'Fruit Smoothie', nameTr: 'Meyve Smoothie', category: 'snack', per100g: { calories: 56, protein: 1, carbs: 13, fat: 0.2 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },

  // ═══════════════════════════════════════
  // KAKAO ÇEŞİTLERİ
  // ═══════════════════════════════════════
  { id: 'cocoa_powder', name: 'Cocoa Powder', nameTr: 'Kakao Tozu', category: 'beverage', per100g: { calories: 228, protein: 19.6, carbs: 57.9, fat: 13.7 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 5 }] },
  { id: 'hot_chocolate', name: 'Hot Chocolate', nameTr: 'Sıcak Çikolata', category: 'beverage', per100g: { calories: 75, protein: 3, carbs: 12, fat: 2 }, commonPortions: [{ name: '1 bardak', grams: 250 }] },
  { id: 'chocolate_milk', name: 'Chocolate Milk', nameTr: 'Kakaolu Süt', category: 'beverage', per100g: { calories: 83, protein: 3.4, carbs: 12, fat: 2.6 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'cocoa_drink', name: 'Cocoa Drink', nameTr: 'Kakaolu İçecek', category: 'beverage', per100g: { calories: 65, protein: 2, carbs: 13, fat: 1.5 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'chocolate_shake', name: 'Chocolate Shake', nameTr: 'Çikolatalı Shake', category: 'beverage', per100g: { calories: 95, protein: 8, carbs: 12, fat: 2.5 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
  { id: 'frosting', name: 'Chocolate Frosting', nameTr: 'Çikolatalı Sos', category: 'snack', per100g: { calories: 393, protein: 3, carbs: 63, fat: 16 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 20 }] },
  { id: 'cocoa_nib', name: 'Cocoa Nibs', nameTr: 'Kakao Parçacıkları', category: 'snack', per100g: { calories: 460, protein: 14, carbs: 58, fat: 31 }, commonPortions: [{ name: '1 yemek kaşığı', grams: 10 }] },

  // ═══════════════════════════════════════
  // KAHVE ÇEŞİTLERİ
  // ═══════════════════════════════════════
  { id: 'black_coffee', name: 'Black Coffee', nameTr: 'Siyah Kahve (Americano)', category: 'beverage', per100g: { calories: 2, protein: 0.3, carbs: 0, fat: 0 }, commonPortions: [{ name: '1 fincan', grams: 150 }] },
  { id: 'turkish_coffee', name: 'Turkish Coffee', nameTr: 'Türk Kahvesi', category: 'beverage', per100g: { calories: 8, protein: 0.1, carbs: 1.5, fat: 0.1 }, commonPortions: [{ name: '1 fincan', grams: 60 }] },
  { id: 'espresso', name: 'Espresso', nameTr: 'Espresso', category: 'beverage', per100g: { calories: 9, protein: 0.1, carbs: 1.7, fat: 0.2 }, commonPortions: [{ name: '1 shot', grams: 30 }, { name: '2 shot', grams: 60 }] },
  { id: 'cappuccino', name: 'Cappuccino', nameTr: 'Kapuçino', category: 'beverage', per100g: { calories: 24, protein: 1.5, carbs: 2.5, fat: 0.8 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'latte', name: 'Caffè Latte', nameTr: 'Latte', category: 'beverage', per100g: { calories: 27, protein: 1.8, carbs: 2.7, fat: 1 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
  { id: 'mocha', name: 'Mocha', nameTr: 'Mocha', category: 'beverage', per100g: { calories: 40, protein: 2, carbs: 5, fat: 1.5 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
  { id: 'macchiato', name: 'Macchiato', nameTr: 'Macchiato', category: 'beverage', per100g: { calories: 13, protein: 0.7, carbs: 1.3, fat: 0.5 }, commonPortions: [{ name: '1 bardak', grams: 80 }] },
  { id: 'flat_white', name: 'Flat White', nameTr: 'Flat White', category: 'beverage', per100g: { calories: 30, protein: 2, carbs: 2.8, fat: 1.2 }, commonPortions: [{ name: '1 bardak', grams: 180 }] },
  { id: 'iced_coffee', name: 'Iced Coffee', nameTr: 'Buzlu Kahve', category: 'beverage', per100g: { calories: 12, protein: 0.5, carbs: 2, fat: 0.3 }, commonPortions: [{ name: '1 bardak', grams: 350 }] },
  { id: 'frappe', name: 'Frappe', nameTr: 'Frappe', category: 'beverage', per100g: { calories: 32, protein: 1, carbs: 6, fat: 0.8 }, commonPortions: [{ name: '1 bardak', grams: 400 }] },
  { id: 'filter_coffee', name: 'Filter Coffee', nameTr: 'Filtre Kahve', category: 'beverage', per100g: { calories: 2, protein: 0.3, carbs: 0, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'cold_brew', name: 'Cold Brew', nameTr: 'Soğuk Demleme', category: 'beverage', per100g: { calories: 3, protein: 0.1, carbs: 0, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
  { id: 'nescafe', name: 'Instant Coffee', nameTr: 'Nescafe', category: 'beverage', per100g: { calories: 4, protein: 0.1, carbs: 0.8, fat: 0 }, commonPortions: [{ name: '1 tatlı kaşığı', grams: 2 }, { name: '1 bardak', grams: 200 }] },
  { id: 'coffee_with_milk', name: 'Coffee with Milk', nameTr: 'Sütlü Kahve', category: 'beverage', per100g: { calories: 18, protein: 1, carbs: 2, fat: 0.6 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },

  // ═══════════════════════════════════════
  // KEBAP & IZGARA
  // ═══════════════════════════════════════
  { id: 'et_sis', name: 'Beef Shish', nameTr: 'Et Şiş', category: 'protein', per100g: { calories: 220, protein: 26, carbs: 1, fat: 12 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'cop_sis', name: 'Çöp Şiş', nameTr: 'Çöp Şiş', category: 'protein', per100g: { calories: 240, protein: 24, carbs: 1, fat: 16 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'izgara_kofte', name: 'Grilled Meatballs', nameTr: 'Izgara Köfte', category: 'protein', per100g: { calories: 250, protein: 19, carbs: 5, fat: 17 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'tekirdag_kofte', name: 'Tekirdağ Meatballs', nameTr: 'Tekirdağ Köftesi', category: 'protein', per100g: { calories: 260, protein: 18, carbs: 6, fat: 18 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'tavuk_pirzola', name: 'Chicken Chops', nameTr: 'Tavuk Pirzola', category: 'protein', per100g: { calories: 200, protein: 24, carbs: 0, fat: 11 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'kuzu_pirzola', name: 'Lamb Chops', nameTr: 'Kuzu Pirzola', category: 'protein', per100g: { calories: 290, protein: 24, carbs: 0, fat: 21 }, commonPortions: [{ name: '1 porsiyon', grams: 180 }] },
  { id: 'patlican_kebabi', name: 'Eggplant Kebab', nameTr: 'Patlıcan Kebabı', category: 'protein', per100g: { calories: 190, protein: 12, carbs: 6, fat: 13 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'hamsi_tava', name: 'Fried Anchovies', nameTr: 'Hamsi Tava', category: 'protein', per100g: { calories: 250, protein: 18, carbs: 10, fat: 15 }, commonPortions: [{ name: '1 porsiyon', grams: 200 }] },
  { id: 'etli_kuru_fasulye', name: 'White Beans with Meat', nameTr: 'Etli Kuru Fasulye', category: 'protein', per100g: { calories: 130, protein: 8, carbs: 14, fat: 4.5 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'etli_nohut', name: 'Chickpeas with Meat', nameTr: 'Etli Nohut', category: 'protein', per100g: { calories: 140, protein: 8, carbs: 16, fat: 5 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'adana_kebab_durum', name: 'Adana Kebab Wrap', nameTr: 'Adana Kebap Dürüm', category: 'carb', per100g: { calories: 260, protein: 13, carbs: 24, fat: 13 }, commonPortions: [{ name: '1 dürüm', grams: 300 }] },
  { id: 'urfa_kebab_durum', name: 'Urfa Kebab Wrap', nameTr: 'Urfa Kebap Dürüm', category: 'carb', per100g: { calories: 250, protein: 13, carbs: 24, fat: 12 }, commonPortions: [{ name: '1 dürüm', grams: 300 }] },
  { id: 'et_doner_durum', name: 'Beef Döner Wrap', nameTr: 'Et Döner Dürüm', category: 'carb', per100g: { calories: 240, protein: 14, carbs: 23, fat: 10 }, commonPortions: [{ name: '1 dürüm', grams: 300 }] },
  { id: 'tavuk_doner_durum', name: 'Chicken Döner Wrap', nameTr: 'Tavuk Döner Dürüm', category: 'carb', per100g: { calories: 215, protein: 15, carbs: 23, fat: 7 }, commonPortions: [{ name: '1 dürüm', grams: 300 }] },

  // ═══════════════════════════════════════
  // DÜNYA MUTFAĞI
  // ═══════════════════════════════════════
  { id: 'pizza_margherita', name: 'Margherita Pizza', nameTr: 'Margarita Pizza', category: 'carb', per100g: { calories: 250, protein: 11, carbs: 31, fat: 9 }, commonPortions: [{ name: '2 dilim', grams: 220 }] },
  { id: 'pizza_karisik', name: 'Mixed Pizza', nameTr: 'Karışık Pizza', category: 'carb', per100g: { calories: 270, protein: 12, carbs: 30, fat: 11 }, commonPortions: [{ name: '2 dilim', grams: 230 }] },
  { id: 'hamburger', name: 'Hamburger', nameTr: 'Hamburger', category: 'protein', per100g: { calories: 250, protein: 13, carbs: 25, fat: 11 }, commonPortions: [{ name: '1 adet', grams: 220 }] },
  { id: 'cheeseburger', name: 'Cheeseburger', nameTr: 'Cheeseburger', category: 'protein', per100g: { calories: 270, protein: 14, carbs: 24, fat: 13 }, commonPortions: [{ name: '1 adet', grams: 240 }] },
  { id: 'hot_dog', name: 'Hot Dog', nameTr: 'Sosisli Sandviç', category: 'carb', per100g: { calories: 260, protein: 10, carbs: 22, fat: 15 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'california_roll', name: 'California Roll', nameTr: 'California Roll', category: 'carb', per100g: { calories: 150, protein: 4, carbs: 24, fat: 4 }, commonPortions: [{ name: '8 parça', grams: 220 }] },
  { id: 'salmon_roll', name: 'Salmon Roll', nameTr: 'Somonlu Roll', category: 'carb', per100g: { calories: 170, protein: 7, carbs: 24, fat: 5 }, commonPortions: [{ name: '8 parça', grams: 220 }] },
  { id: 'tavuklu_noodle', name: 'Chicken Noodles', nameTr: 'Tavuklu Noodle', category: 'carb', per100g: { calories: 150, protein: 9, carbs: 20, fat: 4 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'taco', name: 'Taco', nameTr: 'Taco', category: 'carb', per100g: { calories: 220, protein: 10, carbs: 20, fat: 11 }, commonPortions: [{ name: '2 adet', grams: 170 }] },
  { id: 'burrito', name: 'Burrito', nameTr: 'Burrito', category: 'carb', per100g: { calories: 200, protein: 9, carbs: 25, fat: 7 }, commonPortions: [{ name: '1 adet', grams: 300 }] },
  { id: 'falafel', name: 'Falafel', nameTr: 'Falafel', category: 'protein', per100g: { calories: 333, protein: 13, carbs: 32, fat: 18 }, commonPortions: [{ name: '5 adet', grams: 100 }] },

  // ═══════════════════════════════════════
  // FIRIN & KAHVALTILIK
  // ═══════════════════════════════════════
  { id: 'acma', name: 'Açma', nameTr: 'Açma', category: 'carb', per100g: { calories: 360, protein: 8, carbs: 45, fat: 16 }, commonPortions: [{ name: '1 adet', grams: 90 }] },
  { id: 'boyoz', name: 'Boyoz', nameTr: 'Boyoz', category: 'carb', per100g: { calories: 400, protein: 7, carbs: 40, fat: 24 }, commonPortions: [{ name: '1 adet', grams: 80 }] },
  { id: 'kasarli_tost', name: 'Cheese Toast', nameTr: 'Kaşarlı Tost', category: 'carb', per100g: { calories: 290, protein: 13, carbs: 30, fat: 13 }, commonPortions: [{ name: '1 adet', grams: 150 }] },
  { id: 'su_boregi', name: 'Su Böreği', nameTr: 'Su Böreği', category: 'carb', per100g: { calories: 260, protein: 9, carbs: 25, fat: 14 }, commonPortions: [{ name: '1 dilim', grams: 150 }] },

  // ═══════════════════════════════════════
  // TATLILAR
  // ═══════════════════════════════════════
  { id: 'fistikli_baklava', name: 'Pistachio Baklava', nameTr: 'Fıstıklı Baklava', category: 'snack', per100g: { calories: 430, protein: 7, carbs: 48, fat: 24 }, commonPortions: [{ name: '2 dilim', grams: 80 }] },
  { id: 'cevizli_baklava', name: 'Walnut Baklava', nameTr: 'Cevizli Baklava', category: 'snack', per100g: { calories: 430, protein: 6, carbs: 50, fat: 23 }, commonPortions: [{ name: '2 dilim', grams: 80 }] },
  { id: 'sutlac', name: 'Rice Pudding', nameTr: 'Sütlaç', category: 'snack', per100g: { calories: 120, protein: 3.5, carbs: 20, fat: 3 }, commonPortions: [{ name: '1 kase', grams: 200 }] },
  { id: 'kazandibi', name: 'Kazandibi', nameTr: 'Kazandibi', category: 'snack', per100g: { calories: 160, protein: 4, carbs: 26, fat: 4.5 }, commonPortions: [{ name: '1 dilim', grams: 150 }] },
  { id: 'kunefe', name: 'Künefe', nameTr: 'Künefe', category: 'snack', per100g: { calories: 350, protein: 7, carbs: 40, fat: 18 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'cikolatali_pasta', name: 'Chocolate Cake', nameTr: 'Çikolatalı Pasta', category: 'snack', per100g: { calories: 370, protein: 5, carbs: 50, fat: 17 }, commonPortions: [{ name: '1 dilim', grams: 120 }] },
  { id: 'cheesecake', name: 'Cheesecake', nameTr: 'Cheesecake', category: 'snack', per100g: { calories: 320, protein: 6, carbs: 26, fat: 22 }, commonPortions: [{ name: '1 dilim', grams: 120 }] },
  { id: 'profiterol', name: 'Profiterole', nameTr: 'Profiterol', category: 'snack', per100g: { calories: 300, protein: 5, carbs: 30, fat: 18 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'trilece', name: 'Tres Leches', nameTr: 'Trileçe', category: 'snack', per100g: { calories: 220, protein: 5, carbs: 32, fat: 8 }, commonPortions: [{ name: '1 dilim', grams: 150 }] },
  { id: 'irmik_helvasi', name: 'Semolina Halva', nameTr: 'İrmik Helvası', category: 'snack', per100g: { calories: 330, protein: 5, carbs: 50, fat: 12 }, commonPortions: [{ name: '1 porsiyon', grams: 100 }] },
  { id: 'revani', name: 'Revani', nameTr: 'Revani', category: 'snack', per100g: { calories: 300, protein: 4, carbs: 55, fat: 7 }, commonPortions: [{ name: '1 dilim', grams: 100 }] },

  // ═══════════════════════════════════════
  // GELENEKSEL YEMEKLER
  // ═══════════════════════════════════════
  { id: 'yogurtlu_manti', name: 'Mantı with Yogurt', nameTr: 'Yoğurtlu Mantı', category: 'carb', per100g: { calories: 180, protein: 8, carbs: 22, fat: 7 }, commonPortions: [{ name: '1 porsiyon', grams: 300 }] },
  { id: 'etli_dolma', name: 'Stuffed Vegetables with Meat', nameTr: 'Etli Dolma', category: 'carb', per100g: { calories: 160, protein: 7, carbs: 18, fat: 7 }, commonPortions: [{ name: '1 porsiyon', grams: 250 }] },
  { id: 'biber_dolmasi', name: 'Stuffed Peppers', nameTr: 'Biber Dolması', category: 'carb', per100g: { calories: 150, protein: 6, carbs: 18, fat: 6 }, commonPortions: [{ name: '3 adet', grams: 250 }] },
  { id: 'kisir', name: 'Kısır', nameTr: 'Kısır', category: 'carb', per100g: { calories: 160, protein: 3.5, carbs: 25, fat: 5.5 }, commonPortions: [{ name: '1 porsiyon', grams: 150 }] },
  { id: 'mercimek_kofte', name: 'Lentil Patties', nameTr: 'Mercimek Köftesi', category: 'carb', per100g: { calories: 170, protein: 6, carbs: 28, fat: 4 }, commonPortions: [{ name: '5 adet', grams: 150 }] },
  { id: 'kasarli_pide', name: 'Cheese Pide', nameTr: 'Kaşarlı Pide', category: 'carb', per100g: { calories: 270, protein: 12, carbs: 30, fat: 11 }, commonPortions: [{ name: '1 pide', grams: 280 }] },

  // ═══════════════════════════════════════
  // İÇECEKLER
  // ═══════════════════════════════════════
  { id: 'water', name: 'Water', nameTr: 'Su', category: 'beverage', per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 250 }, { name: '1 şişe', grams: 500 }] },
  { id: 'tea', name: 'Turkish Tea', nameTr: 'Çay', category: 'beverage', per100g: { calories: 1, protein: 0, carbs: 0.3, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'green_tea', name: 'Green Tea', nameTr: 'Yeşil Çay', category: 'beverage', per100g: { calories: 1, protein: 0, carbs: 0.2, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'herbal_tea', name: 'Herbal Tea', nameTr: 'Bitki Çayı', category: 'beverage', per100g: { calories: 1, protein: 0, carbs: 0.3, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'cola', name: 'Cola', nameTr: 'Kola', category: 'beverage', per100g: { calories: 42, protein: 0, carbs: 11, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 330 }] },
  { id: 'soda', name: 'Sparkling Water', nameTr: 'Maden Suyu', category: 'beverage', per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'juice', name: 'Orange Juice', nameTr: 'Portakal Suyu', category: 'beverage', per100g: { calories: 45, protein: 0.7, carbs: 10, fat: 0.2 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'sahlep', name: 'Sahlep', nameTr: 'Sahlep', category: 'beverage', per100g: { calories: 90, protein: 2, carbs: 16, fat: 2 }, commonPortions: [{ name: '1 bardak', grams: 250 }] },
  { id: 'boza', name: 'Boza', nameTr: 'Boza', category: 'beverage', per100g: { calories: 110, protein: 2, carbs: 24, fat: 0.3 }, commonPortions: [{ name: '1 bardak', grams: 250 }] },
  { id: 'kefir', name: 'Kefir', nameTr: 'Kefir', category: 'beverage', per100g: { calories: 41, protein: 3.3, carbs: 4.7, fat: 1 }, commonPortions: [{ name: '1 bardak', grams: 200 }] },
  { id: 'protein_shake', name: 'Protein Shake', nameTr: 'Protein Shake', category: 'beverage', per100g: { calories: 62, protein: 10, carbs: 3, fat: 1.5 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
  { id: 'milkshake', name: 'Milkshake', nameTr: 'Milkshake', category: 'beverage', per100g: { calories: 113, protein: 3.4, carbs: 17, fat: 3.8 }, commonPortions: [{ name: '1 bardak', grams: 300 }] },
];

export function calculateFoodCalories(food: Food, grams: number): { calories: number; protein: number; carbs: number; fat: number } {
  const multiplier = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * multiplier),
    protein: Math.round(food.per100g.protein * multiplier * 10) / 10,
    carbs: Math.round(food.per100g.carbs * multiplier * 10) / 10,
    fat: Math.round(food.per100g.fat * multiplier * 10) / 10,
  };
}

export function searchFoods(query: string): Food[] {
  const q = query.toLowerCase();
  return FOODS.filter(
    (f) => f.name.toLowerCase().includes(q) || f.nameTr.toLowerCase().includes(q)
  );
}

// ─── Gram → Portisyon Dönüşümü ───
// Her besin için yaklaşık adet/porsiyon karşılığı
const PORTION_EQUIVALENTS: Record<string, { gramsPerUnit: number; unitName: string }> = {
  egg:       { gramsPerUnit: 50, unitName: 'adet' },
  banana:    { gramsPerUnit: 120, unitName: 'adet' },
  apple:     { gramsPerUnit: 180, unitName: 'adet' },
  orange:    { gramsPerUnit: 150, unitName: 'adet' },
  bread:     { gramsPerUnit: 30, unitName: 'dilim' },
  whole_wheat_bread: { gramsPerUnit: 35, unitName: 'dilim' },
  milk:      { gramsPerUnit: 200, unitName: 'bardak' },
  ayran:     { gramsPerUnit: 200, unitName: 'bardak' },
  water:     { gramsPerUnit: 250, unitName: 'bardak' },
  butter:    { gramsPerUnit: 15, unitName: 'yemek kaşığı' },
  olive_oil: { gramsPerUnit: 15, unitName: 'yemek kaşığı' },
  peanut_butter: { gramsPerUnit: 32, unitName: 'yemek kaşığı' },
  honey:     { gramsPerUnit: 21, unitName: 'yemek kaşığı' },
  almonds:   { gramsPerUnit: 30, unitName: 'avuç (≈20 adet)' },
  walnut:    { gramsPerUnit: 30, unitName: 'avuç (≈4-5 adet)' },
  hazelnut:  { gramsPerUnit: 30, unitName: 'avuç (≈20 adet)' },
  potato:    { gramsPerUnit: 200, unitName: 'adet (orta)' },
  sweet_potato: { gramsPerUnit: 200, unitName: 'adet' },
  rice:      { gramsPerUnit: 185, unitName: 'bardak (pişmiş)' },
  bulgur_pilavi: { gramsPerUnit: 200, unitName: 'porsiyon' },
  pasta:     { gramsPerUnit: 200, unitName: 'porsiyon (pişmiş)' },
  oats:      { gramsPerUnit: 80, unitName: 'bardak' },
  whey_protein: { gramsPerUnit: 30, unitName: 'ölçek' },
  cottage_cheese: { gramsPerUnit: 150, unitName: 'kase' },
  greek_yogurt: { gramsPerUnit: 200, unitName: 'kase' },
  cheese:    { gramsPerUnit: 30, unitName: 'dilim' },
  kashkaval: { gramsPerUnit: 30, unitName: 'dilim' },
  protein_bar: { gramsPerUnit: 60, unitName: 'adet' },
  lahmacun:  { gramsPerUnit: 150, unitName: 'adet' },
  pide:      { gramsPerUnit: 300, unitName: 'adet' },
  simit:     { gramsPerUnit: 120, unitName: 'adet' },
  mantı:     { gramsPerUnit: 250, unitName: 'porsiyon' },
  kofte:     { gramsPerUnit: 40, unitName: 'adet' },
  doner:     { gramsPerUnit: 200, unitName: 'porsiyon' },
  tavuk_doner: { gramsPerUnit: 200, unitName: 'porsiyon' },
};

export function getPortionEquivalent(food: Food, grams: number): string | null {
  const equiv = PORTION_EQUIVALENTS[food.id];
  if (!equiv || equiv.gramsPerUnit <= 0) return null;
  const units = grams / equiv.gramsPerUnit;
  if (units < 0.25) return null;
  const rounded = units < 1 ? `~%1/4` : units < 1.5 ? `~1 ${equiv.unitName}` : `~${Math.round(units)} ${equiv.unitName}`;
  return `≈ ${rounded}`;
}

export const FOOD_CATEGORIES = [
  { id: 'protein', label: 'Protein', emoji: '🥩' },
  { id: 'carb', label: 'Karbonhidrat', emoji: '🍞' },
  { id: 'fat', label: 'Yağ', emoji: '🥑' },
  { id: 'vegetable', label: 'Sebze', emoji: '🥦' },
  { id: 'fruit', label: 'Meyve', emoji: '🍎' },
  { id: 'dairy', label: 'Süt Ürünleri', emoji: '🥛' },
  { id: 'snack', label: 'Atıştırmalık', emoji: '🍫' },
  { id: 'beverage', label: 'İçecek', emoji: '💧' },
] as const;

// ─── Öğün Uygunluğu ───
// 0 = uygun değil / bilinmiyor, 1 = olabilir, 2 = uygun, 3 = çok uygun

export type MealRelevanceType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack';

type RelevanceScore = 0 | 1 | 2 | 3;
type RelevanceRow = Partial<Record<MealRelevanceType, RelevanceScore>>;

const MAIN_MEAL: RelevanceRow = { lunch: 3, dinner: 3 };
const DURUM: RelevanceRow = { lunch: 2, dinner: 2 };
const WORLD_FOOD: RelevanceRow = { lunch: 2, dinner: 2 };
const BAKERY: RelevanceRow = { breakfast: 2, morning_snack: 1, afternoon_snack: 1 };
const DESSERT: RelevanceRow = { afternoon_snack: 1, evening_snack: 1 };
const TRADITIONAL: RelevanceRow = { lunch: 2, dinner: 2 };

const MEAL_RELEVANCE: Record<string, RelevanceRow> = {
  // Kahvaltılık
  egg: { breakfast: 3, evening_snack: 2 },
  cheese: { breakfast: 3, morning_snack: 1, evening_snack: 1 },
  kashkaval: { breakfast: 3, morning_snack: 1 },
  string_cheese: { breakfast: 2, morning_snack: 2, afternoon_snack: 2 },
  menemen: { breakfast: 3 },
  simit: { breakfast: 2, morning_snack: 2, afternoon_snack: 1 },
  'poğaça': { breakfast: 2, morning_snack: 1, afternoon_snack: 1 },
  'börek': { breakfast: 2, afternoon_snack: 1 },
  gozleme: { breakfast: 2, lunch: 1 },
  bread: { breakfast: 2, lunch: 1, dinner: 1 },
  whole_wheat_bread: { breakfast: 2, lunch: 1, dinner: 1 },
  oats: { breakfast: 3, morning_snack: 1 },
  granola: { breakfast: 2, morning_snack: 1 },
  'müsli': { breakfast: 1, afternoon_snack: 1 },
  honey: { breakfast: 2 },
  butter: { breakfast: 2 },
  peanut_butter: { breakfast: 2, morning_snack: 1, afternoon_snack: 1 },
  tomato: { breakfast: 2, lunch: 1, dinner: 1 },
  cucumber: { breakfast: 2, lunch: 1, dinner: 1 },
  milk: { breakfast: 2, evening_snack: 2 },
  tea: { breakfast: 2, afternoon_snack: 1 },
  turkish_coffee: { morning_snack: 1, afternoon_snack: 1 },

  // Süt ürünleri
  greek_yogurt: { breakfast: 2, morning_snack: 3, afternoon_snack: 2, evening_snack: 3 },
  cottage_cheese: { breakfast: 2, morning_snack: 2, evening_snack: 3 },
  ayran: { lunch: 2, dinner: 1 },
  kefir: { morning_snack: 2, evening_snack: 2 },
  yogurt_with_granola: { breakfast: 2, morning_snack: 2 },

  // Meyve & atıştırmalık
  banana: { breakfast: 1, morning_snack: 3, afternoon_snack: 2 },
  apple: { morning_snack: 3, afternoon_snack: 2 },
  orange: { morning_snack: 2, afternoon_snack: 2 },
  strawberry: { breakfast: 1, morning_snack: 2, afternoon_snack: 2 },
  blueberry: { breakfast: 1, morning_snack: 2, afternoon_snack: 2 },
  almonds: { morning_snack: 2, afternoon_snack: 3 },
  walnut: { breakfast: 1, morning_snack: 2, afternoon_snack: 2 },
  hazelnut: { morning_snack: 2, afternoon_snack: 2 },
  protein_bar: { morning_snack: 2, afternoon_snack: 2 },
  rice_cake: { morning_snack: 1, afternoon_snack: 2 },
  dark_chocolate: { afternoon_snack: 1 },
  whey_protein: { morning_snack: 1, afternoon_snack: 2 },
  protein_shake: { morning_snack: 1, afternoon_snack: 2 },

  // Ana yemek proteinleri
  chicken_breast: MAIN_MEAL,
  chicken_thigh: MAIN_MEAL,
  fish: MAIN_MEAL,
  salmon: MAIN_MEAL,
  beef: MAIN_MEAL,
  beef_lean: MAIN_MEAL,
  lamb: { lunch: 2, dinner: 3 },
  shrimp: { lunch: 2, dinner: 2 },
  tuna: { lunch: 2, dinner: 1, afternoon_snack: 1 },
  kofte: MAIN_MEAL,
  tavuk_sis: MAIN_MEAL,
  adana_kebab: MAIN_MEAL,
  urfa_kebab: MAIN_MEAL,
  iskender: { lunch: 3, dinner: 2 },
  doner: { lunch: 2, dinner: 2 },
  tavuk_doner: { lunch: 2, dinner: 2 },
  tavuk_sote: MAIN_MEAL,
  izmir_kofte: MAIN_MEAL,
  kuru_fasulye: { lunch: 3, dinner: 2 },
  nohut: { lunch: 3, dinner: 2 },

  // Kebap & ızgara (yeni)
  et_sis: MAIN_MEAL,
  cop_sis: MAIN_MEAL,
  izgara_kofte: MAIN_MEAL,
  tekirdag_kofte: MAIN_MEAL,
  tavuk_pirzola: MAIN_MEAL,
  kuzu_pirzola: MAIN_MEAL,
  patlican_kebabi: MAIN_MEAL,
  hamsi_tava: MAIN_MEAL,
  etli_kuru_fasulye: MAIN_MEAL,
  etli_nohut: MAIN_MEAL,
  adana_kebab_durum: DURUM,
  urfa_kebab_durum: DURUM,
  et_doner_durum: DURUM,
  tavuk_doner_durum: DURUM,

  // Dünya mutfağı
  pizza_margherita: WORLD_FOOD,
  pizza_karisik: WORLD_FOOD,
  hamburger: WORLD_FOOD,
  cheeseburger: WORLD_FOOD,
  hot_dog: WORLD_FOOD,
  california_roll: WORLD_FOOD,
  salmon_roll: WORLD_FOOD,
  tavuklu_noodle: WORLD_FOOD,
  taco: WORLD_FOOD,
  burrito: WORLD_FOOD,
  falafel: WORLD_FOOD,

  // Fırın
  acma: BAKERY,
  boyoz: BAKERY,
  kasarli_tost: BAKERY,
  su_boregi: BAKERY,

  // Tatlılar
  fistikli_baklava: DESSERT,
  cevizli_baklava: DESSERT,
  sutlac: DESSERT,
  kazandibi: DESSERT,
  kunefe: DESSERT,
  cikolatali_pasta: DESSERT,
  cheesecake: DESSERT,
  profiterol: DESSERT,
  trilece: DESSERT,
  irmik_helvasi: DESSERT,
  revani: DESSERT,

  // Geleneksel yemekler
  yogurtlu_manti: TRADITIONAL,
  'mantı': TRADITIONAL,
  etli_dolma: TRADITIONAL,
  biber_dolmasi: TRADITIONAL,
  kisir: { lunch: 2, afternoon_snack: 1 },
  mercimek_kofte: { lunch: 2, afternoon_snack: 1 },
  kasarli_pide: TRADITIONAL,
  pide: TRADITIONAL,
  lahmacun: TRADITIONAL,
  imam_bayildi: TRADITIONAL,
  'karnıyarık': TRADITIONAL,
  turlu: TRADITIONAL,
  zeytinyagli_yemek: TRADITIONAL,

  // Çorbalar
  lentil_soup: { lunch: 2, dinner: 2 },
  ezogelin: { lunch: 2, dinner: 2 },
  yayla_soup: { lunch: 2, dinner: 2 },
  tomato_soup: { lunch: 2, dinner: 2 },
  tarhana_soup: { lunch: 2, dinner: 2 },

  // Karbonhidrat & garnitür
  rice: { lunch: 2, dinner: 2 },
  brown_rice: { lunch: 2, dinner: 2 },
  bulgur_pilavi: { lunch: 2, dinner: 2 },
  bulgur: { lunch: 2, dinner: 2 },
  pilav: { lunch: 2, dinner: 2 },
  pasta: { lunch: 2, dinner: 2 },
  quinoa: { lunch: 2, dinner: 2 },
  potato: { lunch: 2, dinner: 2 },
  sweet_potato: { lunch: 2, dinner: 2 },

  // Sebze & salata
  broccoli: { lunch: 1, dinner: 2 },
  spinach: { lunch: 1, dinner: 2 },
  lettuce: { lunch: 1, dinner: 1 },
  cobb_salad: { lunch: 2, dinner: 1 },
  piyaz: { lunch: 1, dinner: 1 },
  gavur_dagi: { lunch: 1, dinner: 1 },
  ezme: { lunch: 1, dinner: 1 },
};

/** Bir besinin belirli bir öğüne ne kadar uygun olduğunu 0-3 arası döndürür. */
export function getMealRelevance(foodId: string, mealType: string): number {
  const row = MEAL_RELEVANCE[foodId];
  if (!row) return 0;
  return row[mealType as MealRelevanceType] ?? 0;
}

/** Besinleri öğün uygunluğuna göre sıralar (eşit skorlarda orijinal sıra korunur). */
export function sortFoodsByMealRelevance<T extends Pick<Food, 'id'>>(foods: T[], mealType: string): T[] {
  return foods
    .map((food, index) => ({ food, index, score: getMealRelevance(food.id, mealType) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.food);
}

/**
 * Öğüne göre sıralanmış besin listesi. Arama metni verilirse önce arama yapılır,
 * kategori verilirse yalnızca o kategori döner. Skoru 0 olanlar listenin sonunda yer alır.
 */
export function getMealRelevantFoods(mealType: string, category?: string, search?: string): Food[] {
  let foods: Food[] = search && search.trim() ? searchFoods(search.trim()) : FOODS;
  if (category) {
    foods = foods.filter((f) => f.category === category);
  }
  return sortFoodsByMealRelevance(foods, mealType);
}
