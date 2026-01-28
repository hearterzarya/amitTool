'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Zap,
  MessageCircle,
  Star,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

export default function FeaturesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const stats = [
    { value: "50+", label: "AI Tools", icon: Sparkles },
    { value: "12K+", label: "Happy Users", icon: Users },
    { value: "99%", label: "Success Rate", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: Clock },
  ];

  const steps = [
    {
      number: "1",
      title: "Choose Your Plan",
      description: "Select from Starter, Pro, or Elite plans based on your needs. All plans include instant access.",
    },
    {
      number: "2",
      title: "Quick Payment",
      description: "Pay securely with crypto, UPI, or cards. Crypto payments get special discounts!",
    },
    {
      number: "3",
      title: "Instant Access",
      description: "Get your credentials delivered instantly via email and WhatsApp within 2 minutes.",
    },
    {
      number: "4",
      title: "Start Creating",
      description: "Login to your premium tools and start boosting your productivity immediately!",
    },
  ];

  const paymentMethods = [
    {
      featured: true,
      title: "Cryptocurrency",
      subtitle: "Secure crypto payments via Cryptomus",
      icon: Bitcoin,
      supported: ["Bitcoin (BTC)", "Ethereum (ETH)", "USDT", "More Cryptos"],
      benefits: [
        "Anonymous Payments",
        "Global Access",
        "Fast Transactions",
        "Lower Fees",
      ],
      color: "from-orange-100 to-yellow-100",
      borderColor: "border-orange-300",
      textColor: "text-orange-700",
    },
    {
      featured: false,
      title: "UPI & Cards",
      subtitle: "Traditional payment methods",
      icon: CreditCard,
      supported: ["UPI", "Credit Cards", "Debit Cards", "Net Banking"],
      benefits: [
        "Instant Processing",
        "Secure Gateway",
        "Multiple Options",
        "Easy Checkout",
      ],
      color: "from-blue-100 to-purple-100",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
    },
  ];

  const testimonials = [
    {
      name: "Raj Patel",
      role: "Digital Marketing Agency Owner",
      company: "GrowthMax Digital",
      initials: "RP",
      review: "AliDigitalSolution transformed our workflow with their AI tools. The ChatGPT Pro access alone saved us 20 hours per week! The support team is incredibly responsive.",
      tools: ["ChatGPT Pro", "Canva Pro", "Grammarly Pro"],
    },
    {
      name: "Priya Sharma",
      role: "Content Creator",
      company: "Freelancer",
      initials: "PS",
      review: "As a content creator, I need multiple tools but couldn't afford individual subscriptions. AliDigitalSolution made it possible with their affordable bundles. Highly recommended!",
      tools: ["Jasper AI", "Midjourney", "Grammarly"],
    },
    {
      name: "Amit Kumar",
      role: "SEO Specialist",
      company: "SEO Masters",
      initials: "AK",
      review: "The Semrush access through AliDigitalSolution helped me grow my agency significantly. Instant activation and reliable service. Best investment for my business!",
      tools: ["Semrush", "Ahrefs", "ChatGPT Pro"],
    },
  ];

  const faqs = [
    {
      question: "How quickly do I get access after payment?",
      answer: "You receive instant access within 10 seconds via automated delivery. Our system sends login credentials directly to your email and WhatsApp for maximum convenience.",
    },
    {
      question: "What crypto payment methods do you accept?",
      answer: "We accept Bitcoin (BTC), Ethereum (ETH), USDT, and other major cryptocurrencies through our secure Cryptomus payment gateway. Crypto payments receive special discounts!",
    },
    {
      question: "Do you provide ongoing support for development projects?",
      answer: "Yes! We offer 24/7 support for all our services. Pro and Elite plan users get priority support with guaranteed response times. We also provide account warranty - if any tool stops working, we'll replace it free of charge.",
    },
    {
      question: "Can I upgrade my plan anytime?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes are prorated and you only pay the difference. No questions asked, no hassle.",
    },
    {
      question: "Are the AI tool accounts shared or private?",
      answer: "All accounts are private and dedicated to you. Elite Bundle includes team sharing for up to 10 members, but Starter and Pro plans are for personal use only. You can upgrade anytime for team features.",
    },
    {
      question: "What happens if my account stops working?",
      answer: "We provide account warranty with all plans. If any tool account stops working, we'll replace it immediately at no extra cost. Our 99.9% uptime guarantee ensures reliable access to all premium tools.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 via-blue-100/30 to-slate-100/30 animate-gradient" />
        <div className="absolute inset-0 bg-grid-slate-300/[0.03] bg-[size:75px_75px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-900">
              50+ Premium AI Tools
              <br />
              <span className="gradient-text">+ Custom Development</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto mb-10">
              Unlock the complete AI arsenal for your business. Premium tools, expert development services, 
              and crypto-friendly payments - all in one premium platform.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 px-8"
              >
                <Link href="/tools">
                  Explore Tools <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg"
                variant="outline"
                className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 px-8"
              >
                <Link href="/tools#tools">View All Tools</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-slate-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Scroll to explore
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <Badge className="glass border-slate-200 text-slate-700 mb-4">
              Trusted by Thousands
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Numbers That Speak</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="text-center glass rounded-xl p-6 border border-slate-200 hover:bg-slate-50 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <Icon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="glass border-slate-200 text-slate-700 mb-4">
              Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in just 4 simple steps. From signup to productivity in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <Card
                key={idx}
                className="glass border border-slate-200 hover:border-purple-500/50 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader>
                  <div className="text-6xl font-bold gradient-text opacity-30 mb-4">{step.number}</div>
                  <CardTitle className="text-xl text-slate-900 mb-2">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="glass border-slate-200 text-slate-700 mb-4">
              Flexible Payments
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">Pay Your Way</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We accept cryptocurrency, UPI, cards, and net banking. Crypto payments get special discounts!
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {paymentMethods.map((method, idx) => {
              const Icon = method.icon;
              return (
                <Card
                  key={idx}
                  className={`relative glass border-2 ${method.borderColor} hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-in-up group`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {method.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 text-orange-700">
                        FEATURED
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${method.color} ${method.textColor} mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl text-slate-900 mb-2">{method.title}</CardTitle>
                    <CardDescription className="text-slate-600">{method.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Supported:</h4>
                      <div className="space-y-2">
                        {method.supported.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center space-x-2 text-sm text-slate-600">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-6">
                      <p className="text-xs text-slate-500 mb-3 group-hover:text-slate-600 transition-colors">
                        Hover for benefits →
                      </p>
                      <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Benefits</h4>
                        {method.benefits.map((benefit, benefitIdx) => (
                          <div key={benefitIdx} className="flex items-center space-x-2 text-sm text-slate-600">
                            <Zap className="h-3 w-3 text-purple-600" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      asChild
                      className={`w-full mt-6 bg-gradient-to-r ${method.featured ? 'from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500' : 'from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'} text-white border-0 transition-all duration-300 hover:scale-105`}
                    >
                      <Link href="/tools">Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="glass border-slate-200 text-slate-700 mb-4">
              Customer Love
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">Success Stories</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who've transformed their business with AliDigitalSolution


            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card
                key={idx}
                className="glass border border-slate-200 hover:border-purple-500/50 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-bold">
                      {testimonial.initials}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">{testimonial.name}</CardTitle>
                      <CardDescription className="text-sm text-slate-600">
                        {testimonial.role} • {testimonial.company}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {testimonial.tools.map((tool, toolIdx) => (
                      <Badge key={toolIdx} variant="secondary" className="glass border-slate-200 text-slate-700 text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 italic">
                    "{testimonial.review}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="glass border-slate-200 text-slate-700 mb-4">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">
              Find answers to common questions about our services, payments, and support
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card
                key={idx}
                className={`glass border border-slate-200 hover:border-purple-500/50 transition-all duration-300 cursor-pointer animate-fade-in-up ${
                  openFaq === idx ? 'bg-slate-50' : ''
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <HelpCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <CardTitle className="text-lg text-slate-900 text-left">{faq.question}</CardTitle>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-600 transition-transform duration-300 flex-shrink-0 ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
                {openFaq === idx && (
                  <CardContent className="pt-0 animate-fade-in-up">
                    <p className="text-slate-700 pl-8">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          <div className="text-center mt-12 animate-fade-in-up">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <p className="text-slate-900 font-semibold mb-4">We're here to help 24/7</p>
            <Button
              asChild
              variant="outline"
              className="glass border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-100 via-blue-100 to-slate-100 text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-blue-200/30 animate-gradient" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 animate-fade-in-up">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg mb-8 text-slate-700 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join 10,000+ successful businesses already using AliDigitalSolution

 premium tools. 
            Get instant access to 50+ AI tools plus expert development services.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {['2-min Delivery', '24/7 Support', 'Instant Access'].map((text, idx) => (
              <Badge 
                key={idx}
                variant="secondary" 
                className="px-4 py-2 text-sm bg-white text-slate-900 border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3 h-3 mr-2 text-green-600" />
                {text}
              </Badge>
            ))}
          </div>

            <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Button 
                asChild 
                size="lg" 
                className="text-base px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                <Link href="/tools">Start Your Journey</Link>
              </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-base px-8 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 hover:border-slate-400 transition-all duration-300"
            >
              <Link href="/contact">Contact Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

