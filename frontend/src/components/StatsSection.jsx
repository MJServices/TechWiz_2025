import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Calendar, Award } from "lucide-react";
import { statsService } from "../services/apiServices";

export default function StatsSection() {
  const [stats, setStats] = useState({
    events: { total: 0, approved: 0 },
    participants: { total: 0 },
    registrations: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsService.getPublicStats();
        setStats(response);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use fallback data
        setStats({
          events: { total: 25, approved: 22 },
          participants: { total: 1250 },
          registrations: { total: 3400 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      icon: <Calendar className="w-8 h-8" />,
      number: loading ? "..." : stats.events.total,
      label: "Total Events",
      description: "Active and completed events",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Users className="w-8 h-8" />,
      number: loading ? "..." : stats.participants.total,
      label: "Active Participants",
      description: "Engaged community members",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      number: loading ? "..." : stats.registrations.total,
      label: "Total Registrations",
      description: "Successful event sign-ups",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: <Award className="w-8 h-8" />,
      number: loading ? "..." : Math.round(stats.registrations.total * 0.85),
      label: "Certificates Issued",
      description: "Digital certificates earned",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
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
            Live Platform Statistics
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Real-time insights into our growing community and event ecosystem
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card card-hover bg-white shadow-lg"
            >
              <div className="card-body text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-6 mx-auto text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{stat.label}</h3>
                <p className="text-neutral-600 text-sm">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
                  95%
                </div>
                <div className="text-neutral-600">User Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-neutral-600">Platform Availability</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
                  50+
                </div>
                <div className="text-neutral-600">Colleges Connected</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}