import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Product, Purchase, Review } from '../types';
import { 
  Package, 
  ClipboardList, 
  Star, 
  Plus, 
  Download, 
  CheckCircle2, 
  Truck, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reviews'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Purchase[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for new product
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    paymentLink: '',
    category: '',
    comboWith: ''
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'purchases'), orderBy('date', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase)));
    });

    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('date', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      setIsLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubReviews();
    };
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      alert('Por favor, selecione uma imagem para o produto.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload image to Storage
      const storageRef = ref(storage, `products/${Date.now()}_${productImage.name}`);
      await uploadBytes(storageRef, productImage);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Save product to Firestore
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        image: imageUrl,
        createdAt: new Date().toISOString()
      });

      setIsAddingProduct(false);
      setNewProduct({ name: '', price: '', description: '', paymentLink: '', category: '', comboWith: '' });
      setProductImage(null);
    } catch (error) {
      console.error("Error adding product:", error);
      alert('Erro ao cadastrar produto.');
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Purchase['status']) => {
    try {
      await updateDoc(doc(db, 'purchases', orderId), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Painel do Vendedor</h1>
          <p className="text-gray-500 font-medium">Gerencie seus produtos, pedidos e avaliações.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ClipboardList size={18} />
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Package size={18} />
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'reviews' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Star size={18} />
            Avaliações
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-bold">Nenhum pedido encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-50">
                        <Package className="text-gray-300" size={24} />
                      </div>
                      <div>
                        <h3 className="font-black tracking-tight text-lg uppercase">{order.productName}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-400">
                          <span>Cliente: {order.userName || 'Usuário'}</span>
                          <span>Email: {order.userEmail || 'N/A'}</span>
                          <span>Data: {new Date(order.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'Aguardando pagamento' ? 'bg-amber-50 text-amber-600' :
                        order.status === 'Comprovante enviado' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'Em produção' ? 'bg-purple-50 text-purple-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {order.status}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.comprovanteUrl && (
                          <a 
                            href={order.comprovanteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-xs font-bold"
                          >
                            <Download size={16} />
                            Comprovante
                          </a>
                        )}

                        {order.status === 'Comprovante enviado' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Em produção')}
                            className="px-4 py-2 bg-black text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} />
                            Confirmar Pagamento
                          </button>
                        )}

                        {order.status === 'Em produção' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Entregue')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all flex items-center gap-2"
                          >
                            <Truck size={16} />
                            Concluir Pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div 
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
              >
                <Plus size={18} />
                Novo Produto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden flex items-center justify-center p-8">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black tracking-tight text-lg uppercase">{product.name}</h3>
                      <span className="font-bold text-black">{product.price}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">{product.category || 'Sem categoria'}</p>
                    <div className="flex items-center gap-2">
                      <a 
                        href={product.paymentLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-grow bg-gray-50 text-gray-600 py-2 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Link de Pagamento
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Modal */}
            <AnimatePresence>
              {isAddingProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddingProduct(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 md:p-12">
                      <h2 className="text-3xl font-black tracking-tighter uppercase mb-8">Cadastrar Produto</h2>
                      <form onSubmit={handleAddProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nome do Produto</label>
                            <input 
                              required
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium"
                              placeholder="Ex: Caneca BrutaMed"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Preço</label>
                            <input 
                              required
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium"
                              placeholder="Ex: R$ 45,00"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Descrição</label>
                          <textarea 
                            required
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium min-h-[100px]"
                            placeholder="Descreva o produto..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Link de Pagamento (Mercado Pago)</label>
                          <input 
                            required
                            value={newProduct.paymentLink}
                            onChange={(e) => setNewProduct({...newProduct, paymentLink: e.target.value})}
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium"
                            placeholder="https://mpago.la/..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Categoria</label>
                            <input 
                              value={newProduct.category}
                              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium"
                              placeholder="Ex: Acessórios"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Combo com (ID do Produto)</label>
                            <input 
                              value={newProduct.comboWith}
                              onChange={(e) => setNewProduct({...newProduct, comboWith: e.target.value})}
                              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium"
                              placeholder="Ex: id-do-outro-produto"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Imagem do Produto</label>
                          <div className="relative">
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                              className="hidden"
                              id="product-image-upload"
                            />
                            <label 
                              htmlFor="product-image-upload"
                              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm font-bold text-gray-500"
                            >
                              <ImageIcon size={18} />
                              {productImage ? productImage.name : 'Selecionar Imagem'}
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => setIsAddingProduct(false)}
                            className="flex-grow bg-gray-100 text-black py-4 rounded-full font-bold text-sm hover:bg-gray-200 transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            disabled={isUploading}
                            className="flex-grow bg-black text-white py-4 rounded-full font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Produto'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div 
            key="reviews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Star className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-bold">Nenhuma avaliação encontrada.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-sm">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{review.userName}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-2">{review.comment}</p>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        Produto ID: {review.productId} • {new Date(review.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
