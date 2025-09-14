import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle, Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, HelpCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { contactService } from "../services/apiServices";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "message":
        if (!value.trim()) {
          error = "Message is required";
        } else if (value.trim().length < 10) {
          error = "Message must be at least 10 characters";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      await contactService.contactSubmit(formData);
      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "General Inquiries",
      content: "info@eventsphere.com",
      description: "General questions and information",
      category: "general"
    },
    {
      icon: MessageCircle,
      title: "Technical Support",
      content: "support@eventsphere.com",
      description: "Technical issues and help",
      category: "support"
    },
    {
      icon: Phone,
      title: "Phone Support",
      content: "+1 (555) 123-4567",
      description: "Mon-Fri from 8am to 5pm EST",
      category: "support"
    },
    {
      icon: MapPin,
      title: "Office Location",
      content: "123 University Ave, College Town, ST 12345",
      description: "Visit our campus office",
      category: "general"
    },
    {
      icon: HelpCircle,
      title: "Help Center",
      content: "24/7 Knowledge Base",
      description: "Self-service resources and FAQs",
      category: "support"
    },
    {
      icon: Clock,
      title: "Response Time",
      content: "Within 24 hours",
      description: "Typical response for inquiries",
      category: "general"
    }
  ];

  const socialMediaLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      url: "https://facebook.com/eventsphere",
      color: "hover:text-blue-600"
    },
    {
      icon: Twitter,
      name: "Twitter",
      url: "https://twitter.com/eventsphere",
      color: "hover:text-sky-500"
    },
    {
      icon: Instagram,
      name: "Instagram",
      url: "https://instagram.com/eventsphere",
      color: "hover:text-pink-600"
    },
    {
      icon: Linkedin,
      name: "LinkedIn",
      url: "https://linkedin.com/company/eventsphere",
      color: "hover:text-blue-700"
    },
    {
      icon: Youtube,
      name: "YouTube",
      url: "https://youtube.com/eventsphere",
      color: "hover:text-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
              Have questions or need support? We'd love to hear from you.
              Get in touch and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods & Support */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Contact Methods & Support
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Multiple ways to reach us. Choose the method that works best for your needs.
            </p>
          </motion.div>

          {/* General Contact */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">General Contact</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contactInfo.filter(info => info.category === 'general').map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-glass-medium/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:scale-105 transition-all duration-300 hover:shadow-lg"
                >
                  <info.icon className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <h4 className="text-xl font-bold mb-2 text-white">{info.title}</h4>
                  <p className="text-purple-400 font-medium mb-1">{info.content}</p>
                  <p className="text-gray-400 text-sm">{info.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Support Options */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Support & Help</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contactInfo.filter(info => info.category === 'support').map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-glass-medium/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:scale-105 transition-all duration-300 hover:shadow-lg"
                >
                  <info.icon className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <h4 className="text-xl font-bold mb-2 text-white">{info.title}</h4>
                  <p className="text-purple-500 font-medium mb-1">{info.content}</p>
                  <p className="text-gray-400 text-sm">{info.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-glass-medium/20 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              Follow Us
            </h2>
            <p className="text-gray-300 mb-8">
              Stay connected and get the latest updates from EventSphere on social media.
            </p>
            <div className="flex justify-center space-x-4 sm:space-x-6">
              {socialMediaLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-glass-light/10 rounded-full flex items-center justify-center border border-white/20 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>


      {/* Contact Form Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-glass-medium/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                Send us a Message
              </h2>
              <p className="text-gray-300">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-300">Thank you for contacting us. We'll respond soon.</p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      aria-describedby="name-error"
                      className={`w-full px-4 py-3 bg-glass-light/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 ${
                        errors.name ? 'border-red-400' : 'border-white/20'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      aria-describedby="email-error"
                      className={`w-full px-4 py-3 bg-glass-light/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 ${
                        errors.email ? 'border-red-400' : 'border-white/20'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-sm text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    aria-describedby="message-error"
                    className={`w-full px-4 py-3 bg-glass-light/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 resize-vertical ${
                      errors.message ? 'border-red-400' : 'border-white/20'
                    }`}
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && (
                    <p id="message-error" className="mt-1 text-sm text-red-400">
                      {errors.message}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-bold text-white hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}