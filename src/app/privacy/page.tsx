import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <AppShell>
      <section className="bg-slate-50 py-14 md:py-20">
        <div className="container-custom max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
          <Card className="border-slate-200">
            <CardContent className="pt-8 space-y-4 text-slate-700 leading-relaxed">
              <p>
                We collect basic information needed to create and manage your account, process orders, and provide
                customer support.
              </p>
              <p>
                We do not sell your personal data. Information is used for account access, service improvement, and
                important communication related to your purchases.
              </p>
              <p>
                By using this website, you agree to this policy. For privacy-related requests, contact support through
                the contact options shown on the website.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
