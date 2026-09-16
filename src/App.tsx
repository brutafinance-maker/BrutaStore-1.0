import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import MyPurchases from './components/MyPurchases';
import SellerDashboard from './components/SellerDashboard';
import { auth, db } from './firebase';
import { getDoc, doc } from 'firebase/firestore';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isVendedor, setIsVendedor] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsVendedor(userDoc.data().vendedor || user.email === "matheusenge2@gmail.com");
        }
      } else {
        setIsVendedor(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    if (page === 'seller' && !isVendedor) {
      setCurrentPage('home');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      
      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            <Hero />
          </>
        )}

        {currentPage === 'orders' && (
          <div className="pt-24">
            <MyPurchases />
          </div>
        )}

        {currentPage === 'seller' && isVendedor && (
          <div className="pt-24">
            <SellerDashboard />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
