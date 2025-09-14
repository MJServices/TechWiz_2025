import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Award,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function HeroSection() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="pt-20 pb-16 px-6 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              🎉 Welcome to the Future of Campus Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent leading-tight"
          >
            EventSphere
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your college experience with seamless event discovery,
            effortless registration, and unforgettable campus moments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center"
          >
            <Link
              to="/events"
              className="group btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Explore Events
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/register"
              className="btn btn-outline text-lg px-8 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-300"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Community
            </Link>
          </motion.div>

          {/* Live Clock Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-12 inline-block"
          >
            <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="flex items-center space-x-3 text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-2">
                    <Clock className="w-6 h-6 text-purple-400" />
                    <span>{formatTime(currentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <MapPin className="w-4 h-4" />
                    <span>{formatDate(currentTime)}</span>
                  </div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-purple-300 to-purple-500"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">247</div>
                  <div className="text-sm text-neutral-500">Active Events</div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-purple-300 to-purple-500"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">12.5K</div>
                  <div className="text-sm text-neutral-500">Participants</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}