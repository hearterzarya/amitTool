import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Settings, Cookie, Upload, Trash2, TestTube } from 'lucide-react';
import Link from 'next/link';
import { AdminExtensionDownload } from '@/components/admin/admin-extension-download';

export default async function AdminExtensionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Copy Cookies Extension</h1>
        <p className="text-slate-600">Simple extension to extract and copy cookies from any website</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Download Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-blue-600" />
              <CardTitle>Download Extension</CardTitle>
            </div>
            <CardDescription>
              Download and install the extension to copy cookies from websites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Installation Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                <li>Download the extension ZIP file</li>
                <li>Extract the ZIP file to a folder</li>
                <li>Open Chrome/Edge and go to <code className="bg-white px-1 rounded">chrome://extensions/</code></li>
                <li>Enable "Developer mode" (top right)</li>
                <li>Click "Load unpacked" and select the extracted folder</li>
                <li>The extension icon will appear in your toolbar</li>
              </ol>
            </div>
            <AdminExtensionDownload />
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Cookie className="h-6 w-6 text-green-600" />
              <CardTitle>Features</CardTitle>
            </div>
            <CardDescription>
              Simple one-click cookie extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Cookie className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Extract & Copy Cookies</h4>
                  <p className="text-sm text-slate-600">Extract all cookies from the current tab and copy them as JSON to your clipboard</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">One Click</h4>
                  <p className="text-sm text-slate-600">Just click the button - cookies are automatically formatted and copied</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>Step-by-step guide for managing cookies</CardDescription>
        </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Navigate to Website
                </h3>
                <p className="text-sm text-slate-600 ml-8">
                  Go to the website you want to extract cookies from (e.g., chat.openai.com) and log in if needed.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Copy Cookies
                </h3>
                <p className="text-sm text-slate-600 ml-8">
                  Click the extension icon in your browser toolbar, then click "Copy Cookies to Clipboard". 
                  All cookies from the current tab will be extracted, formatted as JSON, and copied to your clipboard.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Use Cookies
                </h3>
                <p className="text-sm text-slate-600 ml-8">
                  Paste the cookies JSON wherever you need them. The cookies are formatted in the standard JSON structure 
                  with all necessary fields (name, value, domain, path, secure, httpOnly, sameSite, expirationDate).
                </p>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-6 flex gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/tools">Back to Tools</Link>
        </Button>
        <Button asChild>
          <Link href="/admin">Admin Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
