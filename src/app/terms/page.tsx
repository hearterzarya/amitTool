import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <AppShell>
      <section className="bg-slate-50 py-14 md:py-20">
        <div className="container-custom max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Terms of Service</h1>
          <Card className="border-slate-200">
            <CardContent className="pt-8 space-y-4 text-slate-700 leading-relaxed">
              <p>
                By using Amit Techsolution, you agree to use the service lawfully and not misuse access provided
                through this platform.
              </p>
              <p>
                Product availability, pricing, and support timelines may change as required. We aim to keep all details
                accurate and up to date.
              </p>
              <p>
                For issues related to orders or access, contact support first so we can resolve the matter quickly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
