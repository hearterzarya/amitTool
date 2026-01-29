'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { useContactInfo } from "@/components/providers/contact-info-provider";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  MessageCircle,
  ArrowRight,
  Mail,
  Phone
} from "lucide-react";

export default function FAQPage() {
  const contactInfo = useContactInfo();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      category: "General",
      questions: [
        {
          question: `What is ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'}?`,
          answer: `${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'} is a platform that provides affordable access to premium AI tools like ChatGPT Plus, Claude Pro, Midjourney, and 50+ more tools. We offer shared accounts at a fraction of the original cost, making premium AI accessible to everyone.`,
        },
        {
          question: `How does ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'} work?`,
          answer: "Simply choose a tool or plan, make a secure payment, and receive instant access via email and WhatsApp within 2 minutes. You'll get login credentials to access the premium tool immediately.",
        },
        {
          question: "Is this legal?",
          answer: "Yes, we operate within the terms of service of the tools we provide. We offer shared access to premium accounts, which is a common practice. All accounts are legitimate and purchased directly from the tool providers.",
        },
        {
          question: "What tools are available?",
          answer: "We offer 50+ premium AI tools including ChatGPT Plus, Claude Pro, Midjourney, Canva Pro, Grammarly Premium, GitHub Copilot, Notion AI, Perplexity Pro, and many more. Check our Tools page for the complete list.",
        },
      ],
    },
    {
      category: "Pricing & Payments",
      questions: [
        {
          question: "How much does it cost?",
          answer: "Our prices start from ₹30/month for individual tools. We also offer bundle plans (Starter, Pro, Elite) that provide access to multiple tools at discounted rates. Check our Pricing page for detailed plans.",
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept Bitcoin (BTC), Ethereum (ETH), USDT, and other major cryptocurrencies through Cryptomus, as well as UPI, Credit Cards, Debit Cards, and Net Banking through Paygic. Crypto payments receive special discounts!",
        },
        {
          question: "Do you offer refunds?",
          answer: "Yes, we offer a 100% money-back guarantee within 7 days of purchase if you're not satisfied. Contact our support team for refund requests.",
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees. The price you see is the price you pay. All prices are clearly displayed in INR (₹) with no additional charges.",
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.",
        },
      ],
    },
    {
      category: "Account & Access",
      questions: [
        {
          question: "How quickly will I get access?",
          answer: "99% of orders are delivered within 2 minutes of payment confirmation. You'll receive credentials via email and WhatsApp instantly.",
        },
        {
          question: "Will I get my own account?",
          answer: "We provide shared premium accounts. This allows us to offer access at affordable prices. Multiple users share the same premium account, but your usage is private and secure.",
        },
        {
          question: "What if the account doesn't work?",
          answer: "If you encounter any issues, contact our 24/7 support team immediately. We'll provide a replacement account or full refund within 24 hours.",
        },
        {
          question: "Can I use the account on multiple devices?",
          answer: "Yes, you can use the account on multiple devices. However, please note that these are shared accounts, so simultaneous usage by multiple users may occur.",
        },
        {
          question: "How long does access last?",
          answer: "Access lasts for the duration of your subscription (monthly). Your subscription will auto-renew unless you cancel it.",
        },
      ],
    },
    {
      category: "Support & Safety",
      questions: [
        {
          question: "What if I need help?",
          answer: "We offer 24/7 customer support via WhatsApp and email. Our team typically responds within minutes. You can also check our documentation and guides for common issues.",
        },
        {
          question: "Is my payment information safe?",
          answer: "Absolutely. We use industry-standard encryption and secure payment gateways (Paygic and Cryptomus). We never store your full payment details on our servers.",
        },
        {
          question: "What if the tool updates or changes?",
          answer: "We continuously monitor all tools and update accounts as needed. If a tool changes significantly, we'll notify you and provide alternatives if necessary.",
        },
        {
          question: "Do you provide customer support?",
          answer: "Yes! We have a dedicated 24/7 support team available via WhatsApp and email. We're here to help with any questions or issues you may have.",
        },
      ],
    },
    {
      category: "Technical",
      questions: [
        {
          question: "Do I need to install anything?",
          answer: "No installation required for most tools. You'll receive login credentials and can access the tools directly through their web interfaces. Some tools may require browser extensions for cookie-based access.",
        },
        {
          question: "What is the AliDigitalSolution Browser Extension?",
          answer: "The AliDigitalSolution Browser Extension allows you to access tools that require cookie-based authentication. It securely injects session cookies into your browser, allowing you to access premium tools with your own browser session.",
        },
        {
          question: "Will my data be safe?",
          answer: "Yes, your data is completely private. We only provide access credentials. All your usage, data, and content remain private to you. We don't have access to your account activity or data.",
        },
        {
          question: "What happens if a tool is discontinued?",
          answer: "If a tool is discontinued or becomes unavailable, we'll notify you immediately and provide a replacement tool of equal or greater value, or offer a full refund.",
        },
      ],
    },
  ];

  const allQuestions = faqs.flatMap((category, catIdx) =>
    category.questions.map((faq, qIdx) => ({
      ...faq,
      category: category.category,
      index: catIdx * 100 + qIdx,
    }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pt-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4">
            <HelpCircle className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find answers to common questions. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {faqs.map((category, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="glass border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300"
                onClick={() => {
                  const firstQIndex = idx * 100;
                  setOpenFaq(firstQIndex);
                  document.getElementById(`faq-${firstQIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {category.category}
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Items by Category */}
        {faqs.map((category, catIdx) => (
          <div key={catIdx} className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded"></div>
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.questions.map((faq, qIdx) => {
                const index = catIdx * 100 + qIdx;
                return (
                  <Card
                    key={qIdx}
                    id={`faq-${index}`}
                    className={`glass border-slate-200 hover:border-purple-500/50 transition-all duration-300 cursor-pointer ${
                      openFaq === index ? 'bg-white/50' : ''
                    }`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg text-slate-900 text-left flex-1">
                          {faq.question}
                        </CardTitle>
                        <div className="flex-shrink-0">
                          {openFaq === index ? (
                            <ChevronUp className="h-5 w-5 text-purple-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {openFaq === index && (
                      <CardContent className="pt-0">
                        <div className="pl-1">
                          <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still Have Questions Section */}
        <Card className="glass border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 mt-12">
          <CardContent className="pt-8 pb-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Our support team is available 24/7 to help you with any questions or concerns. Get in touch with us via WhatsApp or email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <a href={`https://wa.me/${contactInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Support
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <a href={`mailto:${process.env.EMAIL_FROM || 'support@amittechsolution.com'}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tools" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Browse Tools
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/features" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Features
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/reviews" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

