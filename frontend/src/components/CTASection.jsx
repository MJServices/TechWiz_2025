import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Calendar, ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-white/5 to-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-purple-600/20 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to Create Amazing Events?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-xl mb-8 opacity-90"
          >
            Join thousands of students and organizers who trust EventSphere
            to make every event unforgettable. Start your journey today!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center"
          >
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-white text-purple-600 hover:bg-neutral-50 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-purple-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <span className="relative z-10 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>

            <Link
              to="/events"
              className="group relative px-8 py-4 bg-white/10 backdrop-blur-lg text-white hover:bg-white/20 rounded-2xl font-semibold border border-white/20 hover:border-white/40 transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
              </span>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-white/20"
          >
            <p className="text-sm opacity-75 mb-4">Trusted by students from</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm opacity-90">
              <span>MIT</span>
              <span>•</span>
              <span>Stanford</span>
              <span>•</span>
              <span>Harvard</span>
              <span>•</span>
              <span>Berkeley</span>
              <span>•</span>
              <span>Yale</span>
              <span>•</span>
              <span>50+ Universities</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}