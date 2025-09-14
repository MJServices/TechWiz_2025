import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      content: "EventSphere made organizing our tech fest incredibly easy. The platform is intuitive and powerful!",
      avatar: "SJ",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Event Organizer",
      content: "The analytics and participant management features are game-changing. Highly recommended!",
      avatar: "MC",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Cultural Committee Head",
      content: "Our cultural events have never been more successful. The registration system is flawless.",
      avatar: "ED",
      rating: 5
    },
    {
      name: "Alex Rodriguez",
      role: "Sports Coordinator",
      content: "Managing inter-college tournaments is now effortless. The real-time updates are fantastic.",
      avatar: "AR",
      rating: 5
    },
    {
      name: "Lisa Wang",
      role: "Workshop Facilitator",
      content: "The certificate generation and tracking system saves us hours of work every month.",
      avatar: "LW",
      rating: 5
    },
    {
      name: "David Kim",
      role: "Student Council President",
      content: "EventSphere has transformed how we engage with our student community. Simply amazing!",
      avatar: "DK",
      rating: 5
    }
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
            What Our Community Says
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Join thousands of satisfied users who trust EventSphere for their campus event needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card bg-white shadow-lg"
            >
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <Quote className="w-8 h-8 text-purple-500 mr-3" />
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-neutral-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                    <div className="text-sm text-neutral-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Trusted by Leading Institutions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-sm text-neutral-600">Universities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">25K+</div>
                <div className="text-sm text-neutral-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-sm text-neutral-600">Events Hosted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">4.9/5</div>
                <div className="text-sm text-neutral-600">Average Rating</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}