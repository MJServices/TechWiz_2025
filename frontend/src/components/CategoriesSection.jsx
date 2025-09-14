import { motion } from "framer-motion";
import {
  Code,
  Palette,
  Trophy,
  BookOpen,
  Music,
  Gamepad2,
  Microscope,
  Users,
} from "lucide-react";

export default function CategoriesSection() {
  const categories = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Technical",
      description: "Coding competitions, hackathons, and tech workshops",
      events: 45,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Cultural",
      description: "Art exhibitions, performances, and cultural festivals",
      events: 32,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Sports",
      description: "Inter-college tournaments and athletic competitions",
      events: 28,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Workshops",
      description: "Skill development sessions and learning workshops",
      events: 67,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: "Music & Arts",
      description: "Concerts, dance performances, and art showcases",
      events: 23,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Gaming",
      description: "Esports tournaments and gaming competitions",
      events: 18,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Microscope className="w-8 h-8" />,
      title: "Science",
      description: "Research presentations and science exhibitions",
      events: 15,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Social",
      description: "Community events and social gatherings",
      events: 41,
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
            Explore Event Categories
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Discover events across various categories that match your interests and passions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="card card-hover bg-white shadow-lg h-full">
                <div className="card-body text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-all duration-300 text-white shadow-lg`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {category.title}
                  </h3>
                  <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300 text-sm mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-purple-600 font-medium">
                      {category.events} events
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Join the Community
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">269</div>
                <div className="text-sm text-neutral-600">Total Events</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">8</div>
                <div className="text-sm text-neutral-600">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">12.5K</div>
                <div className="text-sm text-neutral-600">Participants</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-sm text-neutral-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}