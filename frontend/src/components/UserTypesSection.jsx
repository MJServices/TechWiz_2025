import { motion } from "framer-motion";
import {
  User,
  Users,
  Crown,
  Shield,
  Calendar,
  Settings,
  TrendingUp,
  Award,
} from "lucide-react";

export default function UserTypesSection() {
  const userTypes = [
    {
      icon: <User className="w-8 h-8" />,
      title: "Participants",
      description: "Students who discover, register, and participate in campus events",
      features: [
        "Browse and register for events",
        "Receive event notifications",
        "Access certificates",
        "View event history"
      ],
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Organizers",
      description: "Event creators who plan and manage campus activities",
      features: [
        "Create and manage events",
        "Track registrations",
        "Generate reports",
        "Manage participants"
      ],
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Administrators",
      description: "Platform managers who oversee the entire system",
      features: [
        "Approve events",
        "Manage users",
        "System analytics",
        "Platform settings"
      ],
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-r from-purple-50 to-purple-100">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
            Built for Every Campus Member
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Whether you're a student, organizer, or administrator, EventSphere adapts to your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {userTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="card card-hover bg-white shadow-lg h-full">
                <div className="card-body">
                  <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    {type.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {type.title}
                  </h3>
                  <p className="text-neutral-600 mb-6 group-hover:text-neutral-700 transition-colors duration-300">
                    {type.description}
                  </p>
                  <ul className="space-y-3">
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Ready to Get Started?
            </h3>
            <p className="text-neutral-600 mb-6">
              Join thousands of students and organizers already using EventSphere
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                Create Account
              </button>
              <button className="px-6 py-3 bg-white/80 text-purple-600 rounded-xl font-semibold border border-purple-200 hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}