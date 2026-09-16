import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Purchase } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, Upload, X, Star, MessageSquare, Loader2, Trash2 } from 'lucide-react';

export default function MyPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Review states
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (!user) {
        setPurchases([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !auth.currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Purchase[];
      
      setPurchases(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching purchases:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleFileUpload = async (purchaseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(purchaseId);

    try {
      const storageRef = ref(storage, `comprovantes/${purchaseId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'purchases', purchaseId), {
        status: 'Comprovante enviado',
        comprovanteUrl: downloadURL
      });
      setShowSuccess(true);
    } catch (error) {
      console.error("Error updating purchase:", error);
      alert('Erro ao enviar comprovante.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSubmitReview = async (purchase: Purchase) => {
    if (!comment.trim()) return;
    setIsSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        productId: purchase.productId,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'Usuário',
        rating,
        comment,
        date: new Date().toISOString()
      });

      // Mark purchase as reviewed (optional, but good for UI)
      await updateDoc(doc(db, 'purchases', purchase.id), { reviewed: true });
      
      setReviewingId(null);
      setComment('');
      setRating(5);
      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      console.error("Error submitting review:", error);
      alert('Erro ao enviar avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelOrder = async (purchaseId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await deleteDoc(doc(db, 'purchases', purchaseId));
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    }
  };

  const isExpired = (date: string) => {
    const purchaseDate = new Date(date);
    const now = new Date();
    const diffDays = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-black tracking-tighter uppercase">Minhas Compras</h2>
        <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
          {purchases.length} PEDIDOS
        </span>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-green-50 border border-green-100 p-6 rounded-2xl flex items-start gap-4 relative"
          >
            <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-green-900 mb-1">Muito obrigado pela compra!</h4>
              <p className="text-green-800 text-sm leading-relaxed">
                Nossos vendedores já estão preparando tudo pra você. <br />
                <span className="font-bold">Nunca deixe de ser BrutaMed.</span>
              </p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 text-green-600 hover:text-green-800"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {purchases.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Você ainda não realizou nenhuma compra.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <motion.div
              key={purchase.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{purchase.productName}</h3>
                    <span className="text-xs text-gray-400 font-mono">#{purchase.id.slice(0, 6).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(purchase.date).toLocaleDateString('pt-BR')}</span>
                    <span className="font-bold text-black">{purchase.price}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    purchase.status === 'Aguardando pagamento' ? (isExpired(purchase.date) && !purchase.comprovanteUrl ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600') :
                    purchase.status === 'Comprovante enviado' ? 'bg-blue-50 text-blue-600' :
                    purchase.status === 'Em produção' ? 'bg-purple-50 text-purple-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {purchase.status === 'Entregue' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {isExpired(purchase.date) && !purchase.comprovanteUrl && purchase.status === 'Aguardando pagamento' ? 'Prazo expirado' : purchase.status}
                  </div>

                  {purchase.status === 'Aguardando pagamento' && !isExpired(purchase.date) && (
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${purchase.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(purchase.id, e)}
                        disabled={uploadingId === purchase.id}
                      />
                      <label
                        htmlFor={`file-${purchase.id}`}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-gray-800 cursor-pointer transition-all active:scale-95 ${
                          uploadingId === purchase.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingId === purchase.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Upload size={14} />
                        )}
                        Enviar comprovante
                      </label>
                    </div>
                  )}

                  {purchase.status === 'Aguardando pagamento' && isExpired(purchase.date) && !purchase.comprovanteUrl && (
                    <button 
                      onClick={() => handleCancelOrder(purchase.id)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      Cancelar pedido
                    </button>
                  )}

                  {purchase.status === 'Entregue' && !(purchase as any).reviewed && (
                    <button 
                      onClick={() => setReviewingId(purchase.id)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-gray-800 transition-all active:scale-95"
                    >
                      <Star size={14} />
                      Avaliar Produto
                    </button>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <AnimatePresence>
                {reviewingId === purchase.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 border-t border-gray-50 space-y-4">
                      <div className="flex items-center gap-4">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Sua nota:</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              onClick={() => setRating(star)}
                              className={`transition-colors ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                            >
                              <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Seu comentário:</label>
                        <textarea 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm font-medium min-h-[100px]"
                          placeholder="O que você achou do produto?"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setReviewingId(null)}
                          className="px-6 py-3 rounded-full font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleSubmitReview(purchase)}
                          disabled={isSubmittingReview || !comment.trim()}
                          className="flex-grow bg-black text-white py-3 rounded-full font-bold text-xs hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmittingReview ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
                          Enviar Avaliação
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
