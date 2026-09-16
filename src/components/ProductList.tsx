import React, { useState, useEffect } from 'react';
import { PRODUCTS, Product } from '../types';
import ProductCard from './ProductCard';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface ProductListProps {
  variant?: 'showcase' | 'store';
  onBuy?: (product: Product) => void;
}

export default function ProductList({ variant = 'showcase', onBuy }: ProductListProps) {
  return null;
}
