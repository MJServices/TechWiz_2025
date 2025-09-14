import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Users, Award, Globe, Heart, Star, Quote, ChevronLeft, ChevronRight, Calendar, Zap, Shield, BarChart3, Smartphone, Cloud, Target, Eye, Rocket } from "lucide-react";
import api from '../services/eventService';

export default function About() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await api.get('/about');
      setAboutData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch about data:', error);
      // Fallback to static data if API fails
      setAboutData({
        hero: {
          title: "About EventSphere",
          subtitle: "Revolutionizing college event management with innovative technology and seamless user experiences.",
          stats: [
            { label: "Active Users", value: "10,000+", icon: "Users" },
            { label: "Events Hosted", value: "500+", icon: "Award" },
            { label: "Universities", value: "50+", icon: "Globe" }
          ]
        },
        mission: {
          title: "Our Mission",
          description: "We're dedicated to transforming how colleges and universities manage and participate in events. Our platform bridges the gap between organizers and participants, creating memorable experiences that foster community and growth.",
          values: [
            {
              title: "Community First",
              description: "Building stronger communities through meaningful event connections and shared experiences.",
              icon: "Heart"
            },
            {
              title: "Innovation",
              description: "Leveraging cutting-edge technology to simplify event management and enhance participation.",
              icon: "Award"
            },
            {
              title: "Accessibility",
              description: "Making event participation accessible to everyone, regardless of location or background.",
              icon: "Globe"
            }
          ]
        },
        features: {
          title: "Powerful Features for Modern Event Management",
          description: "Discover the comprehensive suite of tools designed to make event planning and participation seamless and engaging.",
          items: [
            {
              title: "Smart Event Discovery",
              description: "AI-powered recommendations and advanced filtering to help participants find events that match their interests and schedule.",
              icon: "Target",
              color: "from-purple-500 to-purple-600"
            },
            {
              title: "Real-time Analytics",
              description: "Comprehensive dashboards with live statistics, attendance tracking, and performance metrics for data-driven decisions.",
              icon: "BarChart3",
              color: "from-purple-600 to-purple-700"
            },
            {
              title: "Mobile-First Experience",
              description: "Fully responsive design with dedicated mobile apps, ensuring seamless access across all devices and platforms.",
              icon: "Smartphone",
              color: "from-purple-700 to-purple-800"
            },
            {
              title: "Secure & Reliable",
              description: "Enterprise-grade security with encrypted data, secure payments, and 99.9% uptime guarantee for peace of mind.",
              icon: "Shield",
              color: "from-purple-800 to-purple-900"
            },
            {
              title: "Cloud-Based Infrastructure",
              description: "Scalable cloud architecture supporting unlimited events, participants, and data storage with automatic backups.",
              icon: "Cloud",
              color: "from-purple-400 to-purple-500"
            },
            {
              title: "Instant Notifications",
              description: "Smart notification system with customizable alerts, reminders, and real-time updates to keep everyone informed.",
              icon: "Zap",
              color: "from-purple-300 to-purple-400"
            }
          ]
        },
        testimonials: [
          {
            name: "Sarah Johnson",
            role: "Event Organizer",
            content: "EventSphere transformed how I manage my events. The platform is intuitive and powerful.",
            rating: 5,
            avatar: "SJ"
          },
          {
            name: "Mike Chen",
            role: "Participant",
            content: "Finding and registering for events has never been easier. Great user experience!",
            rating: 5,
            avatar: "MC"
          },
          {
            name: "Emily Davis",
            role: "Student",
            content: "As a student, I love how EventSphere connects me with amazing college events.",
            rating: 5,
            avatar: "ED"
          }
        ],
        vision: {
          title: "Our Vision for the Future",
          description: "We're building the ultimate ecosystem for campus events, where technology meets human connection to create extraordinary experiences.",
          goals: [
            {
              title: "Global Campus Network",
              description: "Connect students and organizers across universities worldwide, breaking down geographical barriers and fostering international collaboration.",
              icon: "Globe",
              year: "2025"
            },
            {
              title: "AI-Powered Insights",
              description: "Leverage artificial intelligence to provide predictive analytics, personalized recommendations, and automated event optimization.",
              icon: "Rocket",
              year: "2026"
            },
            {
              title: "Virtual Reality Events",
              description: "Create immersive virtual event experiences that rival physical gatherings, making participation accessible from anywhere in the world.",
              icon: "Eye",
              year: "2027"
            }
          ],
          stats: [
            { label: "Universities Connected", value: "500+", icon: "Globe" },
            { label: "Countries Reached", value: "50+", icon: "Award" },
            { label: "Innovation Patents", value: "10+", icon: "Target" }
          ]
        },
        team: [
          {
            name: "Alex Thompson",
            role: "CEO & Founder",
            bio: "Passionate about connecting people through events.",
            avatar: "AT"
          },
          {
            name: "Lisa Rodriguez",
            role: "CTO",
            bio: "Tech enthusiast driving innovation in event management.",
            avatar: "LR"
          },
          {
            name: "David Kim",
            role: "Head of Design",
            bio: "Creating beautiful experiences for our users.",
            avatar: "DK"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % aboutData?.testimonials?.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + aboutData?.testimonials?.length) % aboutData?.testimonials?.length);
  };

  const getIcon = (iconName) => {
    const icons = { Users, Award, Globe, Heart, Target, BarChart3, Smartphone, Shield, Cloud, Zap, Rocket, Eye };
    return icons[iconName] || Users;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
      {/* Full-width Hero Section with Gradient Overlay */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-10"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent leading-tight">
              {aboutData?.hero?.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-3xl text-gray-200 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0">
              {aboutData?.hero?.subtitle}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {aboutData?.hero?.stats?.map((stat, index) => {
                const IconComponent = getIcon(stat.icon);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="bg-glass-dark/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <IconComponent className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                    <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
                    <p className="text-gray-300 text-lg">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              {aboutData?.mission?.title}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {aboutData?.mission?.description}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {aboutData?.mission?.values?.map((value, index) => {
              const IconComponent = getIcon(value.icon);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-glass-dark/20 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-2xl p-6 mb-8 w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-6 text-white text-center">{value.title}</h3>
                  <p className="text-gray-300 text-center leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-950 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
              {aboutData?.features?.title}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {aboutData?.features?.description}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aboutData?.features?.items?.map((feature, index) => {
              const IconComponent = { Target, BarChart3, Smartphone, Shield, Cloud, Zap }[feature.icon] || Target;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 text-white shadow-lg`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white text-center group-hover:text-purple-200 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Slider Section */}
      <section className="py-24 px-6 bg-glass-dark/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Don't just take our word for it - hear from the community that's using EventSphere every day.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-glass-dark/30 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl"
              >
                <Quote className="w-12 h-12 text-purple-500 mb-8 opacity-50 mx-auto" />
                <p className="text-gray-200 text-xl md:text-2xl mb-8 italic text-center leading-relaxed max-w-3xl mx-auto">
                  "{aboutData?.testimonials?.[currentTestimonial]?.content}"
                </p>
                <div className="flex justify-center mb-6">
                  {[...Array(aboutData?.testimonials?.[currentTestimonial]?.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current mx-1" />
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6">
                    {aboutData?.testimonials?.[currentTestimonial]?.avatar}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-xl">{aboutData?.testimonials?.[currentTestimonial]?.name}</h4>
                    <p className="text-gray-400 text-lg">{aboutData?.testimonials?.[currentTestimonial]?.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-glass-dark/50 backdrop-blur-lg rounded-full p-4 border border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-glass-dark/50 backdrop-blur-lg rounded-full p-4 border border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-3">
              {aboutData?.testimonials?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-purple-500 scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {aboutData?.vision?.title}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {aboutData?.vision?.description}
            </p>
          </motion.div>

          {/* Vision Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {aboutData?.vision?.goals?.map((goal, index) => {
              const IconComponent = { Globe, Rocket, Eye }[goal.icon] || Globe;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-bold text-purple-300 bg-purple-800/30 px-3 py-1 rounded-full">
                      {goal.year}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-200 transition-colors duration-300">
                    {goal.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {goal.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Future Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-12 border border-purple-400/30 shadow-2xl"
          >
            <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
              Future Milestones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutData?.vision?.stats?.map((stat, index) => {
                const IconComponent = { Globe, Award, Target }[stat.icon] || Globe;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 text-white shadow-lg">
                      <IconComponent className="w-10 h-10" />
                    </div>
                    <h4 className="text-4xl font-bold text-white mb-2">{stat.value}</h4>
                    <p className="text-gray-300 text-lg">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The passionate individuals behind EventSphere, working tirelessly to create the best event management experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {aboutData?.team?.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-glass-dark/20 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl hover:scale-105 transition-all duration-300 text-center group"
              >
                <div className="w-32 h-32 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {member.avatar}
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">{member.name}</h3>
                <p className="text-purple-400 font-medium mb-6 text-lg">{member.role}</p>
                <p className="text-gray-300 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}