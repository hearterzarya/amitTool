import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="bg-slate-50 py-14 md:py-20">
        <div className="container-custom max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">About Us</h1>
          <Card className="border-slate-200">
            <CardContent className="pt-8 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Amit Techsolution helps Indian students, freelancers, creators, and businesses get access to premium
                digital tools at affordable prices.
              </p>
              <p>
                We started in 2023 with a simple mission: make global-quality tools practical for India. Our team
                focuses on secure access, fast support, and transparent pricing so customers can work better without
                high subscription costs.
              </p>
              <p>
                We continue to improve products, onboarding, and customer support based on real user feedback.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
