import React, { useState, useEffect } from 'react';
import { Product, PRODUCTS, Review } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Plus, Star, User } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onBuy: (product: Product) => void;
}

export default function ProductDetail({ product, onBack, onBuy }: ProductDetailProps) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'), 
      where('productId', '==', product.id),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return () => unsubscribe();
  }, [product.id]);

  // Find the other product for the combo
  const otherProduct = PRODUCTS.find(p => p.id !== product.id && p.id !== '3');
  const comboProduct = PRODUCTS.find(p => p.id === '3');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        VOLTAR
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-50 rounded-3xl p-8 aspect-[4/5] flex items-center justify-center overflow-hidden"
        >
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="space-y-2 mb-8">
            <p className="text-xs font-black tracking-widest text-gray-400 uppercase">Coleção Intermed Norte</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{product.name}</h1>
            <p className="text-2xl font-bold text-black">{product.price}</p>
          </div>

          <div className="prose prose-sm text-gray-500 mb-10">
            <p>
              Produto oficial da BrutaMed — coleção 2026 Intermed Norte. 
              Produzido com qualidade e identidade da atlética.
            </p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={() => onBuy(product)}
              className="w-full bg-black text-white py-5 rounded-full font-black text-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
            >
              <ShoppingBag size={20} />
              COMPRAR AGORA
            </button>

            {/* Combo Section (Amazon Style) */}
            {otherProduct && comboProduct && (
              <div className="pt-8 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Leve também o {otherProduct.name.split(' ')[0].toLowerCase()} e complete seu kit BrutaMed</p>
                
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-lg p-2 border border-gray-100 flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <Plus size={16} className="text-gray-300" />
                    <div className="w-16 h-16 bg-white rounded-lg p-2 border border-gray-100 flex items-center justify-center">
                      <img src={otherProduct.image} alt={otherProduct.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <p className="text-sm font-bold text-black">Combo {product.name.split(' ')[0]} + {otherProduct.name.split(' ')[0]}</p>
                    <p className="text-sm font-medium text-gray-500">{comboProduct.price}</p>
                  </div>

                  <button 
                    onClick={() => onBuy(comboProduct)}
                    className="whitespace-nowrap bg-white border border-black text-black px-6 py-2 rounded-full font-bold text-xs hover:bg-black hover:text-white transition-all active:scale-95"
                  >
                    COMPRAR COMBO
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-100 pt-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Avaliações dos Brutos</h2>
          <div className="flex items-center gap-2">
            <Star className="text-amber-400 fill-amber-400" size={20} />
            <span className="font-black text-xl">
              {reviews.length > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                : '0.0'}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">({reviews.length} avaliações)</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight leading-none mb-1">{review.userName}</p>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
