import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-2"
      >
        <p className="text-sm font-bold tracking-widest uppercase text-gray-500">Nova coleção 2026</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
          INTERMED NORTE
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-10"
      >
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Novidades em breve</p>
      </motion.div>
    </section>
  );
}
