import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Award,
  BookOpen,
  Camera,
  Star,
  Shield,
  Zap,
  Heart,
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Event Discovery",
      description: "Find events that match your interests with our intelligent recommendation system.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Easy Registration",
      description: "Register for events with just a few clicks. No more paper forms or long queues.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Certificates",
      description: "Get digital certificates for event participation automatically.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Resource Hub",
      description: "Access event materials, presentations, and resources in one place.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Event Gallery",
      description: "Relive the moments with our comprehensive event photo and video gallery.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Platform",
      description: "Your data is protected with enterprise-grade security measures.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Updates",
      description: "Get instant notifications about event changes and new opportunities.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Community Driven",
      description: "Built by students, for students. Your feedback shapes our platform.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
            Powerful Features for Modern Campuses
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Everything you need to create, manage, and participate in campus events seamlessly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="card card-hover bg-white shadow-lg h-full">
                <div className="card-body text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-all duration-300 text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}