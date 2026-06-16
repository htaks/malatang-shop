import { Topping } from '../types';

// マーラータンのトッピング・メニューマスターデータ
export const TOPPINGS: Topping[] = [
  // 野菜
  { id: 'v01', name: '白菜', nameEn: 'napa cabbage', kana: 'はくさい', category: 'vegetable', price: 80, spicy: 0, emoji: '🥬' },
  { id: 'v02', name: '青梗菜', nameEn: 'bok choy', kana: 'ちんげんさい', category: 'vegetable', price: 90, spicy: 0, emoji: '🥬' },
  { id: 'v03', name: 'えのき', nameEn: 'enoki mushroom', kana: 'えのき', category: 'vegetable', price: 100, spicy: 0, emoji: '🍄' },
  { id: 'v04', name: 'しめじ', nameEn: 'shimeji mushroom', kana: 'しめじ', category: 'vegetable', price: 100, spicy: 0, emoji: '🍄' },
  { id: 'v05', name: 'もやし', nameEn: 'bean sprouts', kana: 'もやし', category: 'vegetable', price: 70, spicy: 0, emoji: '🌱' },
  { id: 'v06', name: 'れんこん', nameEn: 'lotus root', kana: 'れんこん', category: 'vegetable', price: 110, spicy: 0, emoji: '🪷' },
  { id: 'v07', name: 'じゃがいも', nameEn: 'potato', kana: 'じゃがいも', category: 'vegetable', price: 90, spicy: 0, emoji: '🥔' },
  { id: 'v08', name: 'トマト', nameEn: 'tomato', kana: 'とまと', category: 'vegetable', price: 100, spicy: 0, emoji: '🍅' },

  // 肉
  { id: 'm01', name: '牛肉', nameEn: 'beef', kana: 'ぎゅうにく', category: 'meat', price: 250, spicy: 0, emoji: '🥩' },
  { id: 'm02', name: '豚肉', nameEn: 'pork', kana: 'ぶたにく', category: 'meat', price: 200, spicy: 0, emoji: '🥓' },
  { id: 'm03', name: '鶏肉', nameEn: 'chicken', kana: 'とりにく', category: 'meat', price: 180, spicy: 0, emoji: '🍗' },
  { id: 'm04', name: 'ラム肉', nameEn: 'lamb', kana: 'らむにく', category: 'meat', price: 280, spicy: 0, emoji: '🐑' },
  { id: 'm05', name: 'ウインナー', nameEn: 'sausage', kana: 'ういんなー', category: 'meat', price: 150, spicy: 0, emoji: '🌭' },

  // 海鮮
  { id: 's01', name: 'えび', nameEn: 'shrimp', kana: 'えび', category: 'seafood', price: 220, spicy: 0, emoji: '🦐' },
  { id: 's02', name: 'いか', nameEn: 'squid', kana: 'いか', category: 'seafood', price: 200, spicy: 0, emoji: '🦑' },
  { id: 's03', name: 'あさり', nameEn: 'clam', kana: 'あさり', category: 'seafood', price: 180, spicy: 0, emoji: '🐚' },
  { id: 's04', name: 'つみれ', nameEn: 'fish ball', kana: 'つみれ', category: 'seafood', price: 160, spicy: 0, emoji: '🍡' },

  // 麺・主食
  { id: 'n01', name: '春雨', nameEn: 'glass noodles', kana: 'はるさめ', category: 'noodle', price: 120, spicy: 0, emoji: '🍜' },
  { id: 'n02', name: '中華麺', nameEn: 'chinese noodles', kana: 'ちゅうかめん', category: 'noodle', price: 130, spicy: 0, emoji: '🍜' },
  { id: 'n03', name: 'うどん', nameEn: 'udon', kana: 'うどん', category: 'noodle', price: 130, spicy: 0, emoji: '🍲' },
  { id: 'n04', name: 'ライス', nameEn: 'rice', kana: 'らいす', category: 'noodle', price: 100, spicy: 0, emoji: '🍚' },

  // 豆腐・その他
  { id: 't01', name: '木綿豆腐', nameEn: 'firm tofu', kana: 'もめんどうふ', category: 'tofu', price: 120, spicy: 0, emoji: '🧊' },
  { id: 't02', name: '厚揚げ', nameEn: 'fried tofu', kana: 'あつあげ', category: 'tofu', price: 130, spicy: 0, emoji: '🟫' },
  { id: 't03', name: '湯葉', nameEn: 'tofu skin', kana: 'ゆば', category: 'tofu', price: 140, spicy: 0, emoji: '📜' },

  // 辛さ系トッピング
  { id: 'x01', name: '麻辣油', nameEn: 'mala oil', kana: 'まーらーゆ', category: 'spice', price: 50, spicy: 3, emoji: '🌶️' },
  { id: 'x02', name: '花椒', nameEn: 'sichuan pepper', kana: 'ほあじゃお', category: 'spice', price: 50, spicy: 2, emoji: '🌶️' },
  { id: 'x03', name: '唐辛子', nameEn: 'chili pepper', kana: 'とうがらし', category: 'spice', price: 40, spicy: 3, emoji: '🌶️' },
];

export const CATEGORY_LABELS: Record<Topping['category'] | 'all', string> = {
  all: 'すべて',
  vegetable: '野菜',
  meat: 'お肉',
  seafood: '海鮮',
  noodle: '麺・主食',
  tofu: '豆腐',
  spice: '辛さ',
};