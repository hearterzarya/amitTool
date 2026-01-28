'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Chrome, CheckCircle2, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function ExtensionDownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Chrome className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Download Browser Extension</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            Install our browser extension to access your premium tools seamlessly
          </p>
          <Button
            onClick={() => window.open('https://youtu.be/DPBtd57p5Mg', '_blank')}
            variant="outline"
            size="lg"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Watch Installation Tutorial
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
            <CardDescription>
              Follow these steps to install the browser extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Download the Extension</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Click the download button below to get the extension ZIP file.
                  </p>
                  <a
                    href="/api/extension/download"
                    download="alitool-extension.zip"
                    className="inline-block"
                  >
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Extension (ZIP)
                    </Button>
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Extract the ZIP File</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Extract the downloaded ZIP file to a folder on your computer. Remember where you saved it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Open Chrome Extensions Page</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Open Google Chrome and navigate to the extensions page.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                    chrome://extensions/
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('chrome://extensions/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Extensions Page
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Enable Developer Mode</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Toggle the "Developer mode" switch in the top right corner of the extensions page.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Load the Extension</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click the "Load unpacked" button and select the folder where you extracted the extension.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">You're Done!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    The extension is now installed. Go back to your dashboard and start accessing your tools!
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              What the extension does for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Automatic Login</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access tools with one click - no manual login required
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Secure & Private</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your credentials are encrypted and stored securely
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Easy Access</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Open tools directly from your dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">No Interruptions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seamless experience without login prompts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Need help? Contact our support team
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
