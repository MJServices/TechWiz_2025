import { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import ParticlesBackground from "../components/ParticlesBackground";
import MouseFollower from "../components/MouseFollower";
import FeaturesSection from "../components/FeaturesSection";
import UserTypesSection from "../components/UserTypesSection";
import CategoriesSection from "../components/CategoriesSection";
import StatsSection from "../components/StatsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FloatingBackground from "../components/FloatingBackground";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import EventStatusBadge from "../components/EventStatusBadge";
import { eventsAPI } from "../services/eventService";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Users } from "lucide-react";

// Scroll Progress Indicator Component
const ScrollProgressIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    const throttledUpdate = () => {
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', throttledUpdate, { passive: true });
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener('scroll', throttledUpdate);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 z-50">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

export default function Home() {
  const [activeCard, setActiveCard] = useState(null);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await eventsAPI.getAll({ limit: 6 }); // Get first 6 events
        if (response.events && Array.isArray(response.events)) {
          setFeaturedEvents(response.events.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching featured events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-x-hidden relative">
      {/* Enhanced Background Components */}
      <ParticlesBackground />
      <MouseFollower activeCard={activeCard} />
      <FloatingBackground />

      {/* Additional Glass Morphism Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-pink-500/30 to-purple-700/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating geometric shapes with glass effect */}
        <div
          className="absolute top-1/3 right-1/3 w-24 h-24 border-2 border-purple-500/40 backdrop-blur-lg bg-white/10 rotate-45 animate-spin rounded-lg"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute top-2/3 left-1/5 w-20 h-20 bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-lg rounded-full animate-bounce border border-pink-500/40"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/5 w-16 h-16 border-2 border-cyan-500/40 backdrop-blur-lg bg-cyan-500/15 rounded-full animate-ping"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Mobile menu managed by Navbar */}

      {/* Main Content Sections with enhanced spacing and glass effects */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="relative">
          <HeroSection />
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <FeaturesSection setActiveCard={setActiveCard} />
          </div>
        </section>

        {/* User Types Section */}
        <section id="user-types" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/30 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <UserTypesSection setActiveCard={setActiveCard} />
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <CategoriesSection setActiveCard={setActiveCard} />
          </div>
        </section>

        {/* Featured Events Section */}
        <section id="featured-events" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/30 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                Featured Events
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Check out the latest and most popular events happening on campus.
              </p>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredEvents.map((event, index) => (
                  <div
                    key={event._id}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                  >
                    {/* Event Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.bannerImage || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500";
                        }}
                      />
                      <div className="absolute top-4 right-4">
                        <EventStatusBadge event={event} size="sm" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-purple-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    {/* Event Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {event.date ? new Date(event.date).toLocaleDateString() : "Date TBD"}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          {event.time || "Time TBD"}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.venue || "Venue TBD"}
                        </div>
                      </div>

                      <Link
                        to={`/events/${event._id}`}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-center block"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-700">No events available</h3>
                <p className="text-gray-500">Check back later for upcoming events.</p>
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                to="/events"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
              >
                View All Events
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <StatsSection />
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <TestimonialsSection setActiveCard={setActiveCard} />
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="relative py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/40 to-transparent backdrop-blur-lg bg-white/10"></div>
          <div className="relative z-10">
            <CTASection />
          </div>
        </section>

        {/* Footer */}
        <footer className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent backdrop-blur-lg"></div>
          <div className="relative z-10">
            <Footer />
          </div>
        </footer>
      </main>

      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Floating Action Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl shadow-purple-600/50 backdrop-blur-lg border border-white/20 flex items-center justify-center hover:scale-110 hover:shadow-purple-600/70 transition-all duration-300 z-40 group touch-manipulation"
        aria-label="Scroll to top"
      >
        <svg
          className="w-6 h-6 text-white group-hover:scale-125 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
      </button>
    </div>
  );
}