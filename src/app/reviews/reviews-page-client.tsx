'use client';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  TrendingUp,
  MessageCircle,
  Shield,
  Zap,
  ThumbsUp
} from "lucide-react";
import { ScreenshotGallery } from "@/components/reviews/screenshot-gallery";

interface ReviewsPageClientProps {
  screenshots: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
}

export function ReviewsPageClient({ screenshots }: ReviewsPageClientProps) {
  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Content Creator",
      tool: "ChatGPT Pro",
      initials: "RS",
      rating: 5,
      review: "This platform saved me ₹20,000/month on AI tools! ChatGPT Pro access is instant and works flawlessly. Best investment for my content business.",
      verified: true,
    },
    {
      name: "Priya Patel",
      role: "Digital Marketer",
      tool: "Grammarly + Canva",
      initials: "PP",
      rating: 5,
      review: "Finally found a reliable source for premium tools. Grammarly Pro and Canva Pro at unbeatable prices. Customer support is amazing!",
      verified: true,
    },
    {
      name: "Amit Kumar",
      role: "SEO Specialist",
      tool: "Semrush",
      initials: "AK",
      rating: 5,
      review: "Semrush access helped me grow my agency. Instant activation, no waiting. 10/10 would recommend to all digital marketers.",
      verified: true,
    },
    {
      name: "Sneha Gupta",
      role: "Student",
      tool: "QuillBot + Claude",
      initials: "SG",
      rating: 5,
      review: "As a student, I couldn't afford these tools. This platform made premium AI accessible to me. My academic work improved significantly!",
      verified: true,
    },
    {
      name: "Vikram Singh",
      role: "Freelancer",
      tool: "Multiple Tools",
      initials: "VS",
      rating: 5,
      review: "I was skeptical at first, but the 10-second delivery is real! Been using their services for 6 months now. Absolutely reliable.",
      verified: true,
    },
    {
      name: "Ananya Reddy",
      role: "YouTuber",
      tool: "Leonardo AI + Canva",
      initials: "AR",
      rating: 5,
      review: "Leonardo AI and Canva Pro bundle helped me 10x my thumbnail game. My CTR increased by 40%! Worth every rupee.",
      verified: true,
    },
    {
      name: "Rajesh Mehta",
      role: "Business Owner",
      tool: "ChatGPT + Midjourney",
      initials: "RM",
      rating: 5,
      review: "Running a startup means every rupee counts. This platform gave me access to premium AI tools at a fraction of the cost. Game changer!",
      verified: true,
    },
    {
      name: "Kavya Nair",
      role: "Graphic Designer",
      tool: "Canva Pro + Adobe",
      initials: "KN",
      rating: 5,
      review: "Professional design tools at student prices. The quality is exactly the same as direct subscriptions. Highly recommend!",
      verified: true,
    },
    {
      name: "Arjun Desai",
      role: "Developer",
      tool: "GitHub Copilot + ChatGPT",
      initials: "AD",
      rating: 5,
      review: "As a developer, I need multiple tools. AliDigitalSolution bundle saved me thousands. Setup was instant and support is responsive.",
      verified: true,
    },
  ];

  const stats = [
    { value: '4.9/5', label: 'Average Rating', icon: Star },
    { value: '12,000+', label: 'Happy Users', icon: Users },
    { value: '99%', label: 'Satisfaction Rate', icon: TrendingUp },
    { value: '24/7', label: 'Support', icon: MessageCircle },
  ];

  const proofPoints = [
    {
      title: "Verified Purchases",
      description: "All reviews are from verified customers who have made purchases through our platform.",
      icon: CheckCircle2,
    },
    {
      title: "Real Screenshots",
      description: "Customers share real screenshots of their tool access and usage.",
      icon: Shield,
    },
    {
      title: "Instant Delivery",
      description: "99% of orders are delivered within 2 minutes of payment confirmation.",
      icon: Zap,
    },
    {
      title: "Money Back Guarantee",
      description: "100% refund if you're not satisfied within 7 days of purchase.",
      icon: ThumbsUp,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pt-8 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
            Customer Reviews & Proofs
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See what our customers are saying about AliDigitalSolution. Real reviews from verified users who transformed their workflow.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              className="glass border-slate-200 text-center hover:border-purple-500/50 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Proof Points */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Why Trust Our Reviews?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {proofPoints.map((point, idx) => (
              <Card
                key={idx}
                className="glass border-slate-200 hover:border-purple-500/50 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader>
                  <point.icon className="h-6 w-6 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">{point.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{point.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* WhatsApp Screenshots Gallery */}
        {screenshots.length > 0 && (
          <ScreenshotGallery screenshots={screenshots} />
        )}

        {/* Reviews Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="glass border-slate-200 hover:border-purple-500/50 hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-700 font-bold text-sm">
                        {testimonial.initials}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                          {testimonial.name}
                          {testimonial.verified && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600">
                          {testimonial.role}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="w-fit glass border-slate-200 text-slate-700">
                      {testimonial.tool}
                    </Badge>
                    <div className="flex items-center gap-1 ml-auto">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "{testimonial.review}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="glass border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 mb-8">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Join Thousands of Happy Customers?
            </h2>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Start saving money on premium AI tools today. Get instant access to ChatGPT, Claude, Midjourney, and 50+ more tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <Link href="/tools">
                  Browse Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-4">Trusted by professionals from</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-slate-400">
            <div className="text-sm font-medium">Content Creators</div>
            <div className="text-slate-300">•</div>
            <div className="text-sm font-medium">Digital Marketers</div>
            <div className="text-slate-300">•</div>
            <div className="text-sm font-medium">Developers</div>
            <div className="text-slate-300">•</div>
            <div className="text-sm font-medium">Students</div>
            <div className="text-slate-300">•</div>
            <div className="text-sm font-medium">Business Owners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
