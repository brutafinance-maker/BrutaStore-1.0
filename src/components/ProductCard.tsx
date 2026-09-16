import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  variant?: 'showcase' | 'store';
  onBuy?: (product: Product) => void;
}

export default function ProductCard({ product, variant = 'showcase', onBuy }: ProductCardProps) {
  const isStore = variant === 'store';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => onBuy?.(product)}
      className={`group cursor-pointer ${isStore ? 'bg-white p-3 rounded-xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`${isStore ? 'aspect-[4/5] p-4' : 'aspect-square'} bg-gray-50 overflow-hidden rounded-xl flex items-center justify-center`}>
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out`}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className={`${isStore ? 'mt-3 space-y-1' : 'mt-6 space-y-1'} flex flex-col`}>
        <div className="flex justify-between items-start">
          <h3 className={`${isStore ? 'text-sm' : 'text-lg'} font-bold tracking-tight text-black`}>{product.name}</h3>
          <p className={`${isStore ? 'text-sm' : 'text-base'} font-medium text-black`}>{product.price}</p>
        </div>
        <div className={isStore ? 'pt-2' : 'pt-4'}>
          <button 
            className={`${isStore ? 'w-full text-xs py-2' : 'w-full md:w-auto text-sm py-3 px-8'} bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all active:scale-95`}
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </motion.div>
  );
}
