'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, 
  Download, 
  Chrome, 
  CheckCircle2, 
  X,
  BookOpen,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TutorialSectionProps {
  isNewCustomer?: boolean;
}

export function TutorialSection({ isNewCustomer = false }: TutorialSectionProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Start as true to prevent flash

  // Check if user has dismissed the tutorial (stored in localStorage)
  useEffect(() => {
    // For new customers, always show the tutorial card (ignore localStorage)
    // But don't auto-open the modal - let them click to open it
    if (isNewCustomer) {
      setIsDismissed(false);
      // Don't auto-open - just show the highlighted card
      setShowTutorial(false);
    } else {
      const dismissed = localStorage.getItem('tutorial-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [isNewCustomer]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tutorial-dismissed', 'true');
  };

  const handleDownloadExtension = async () => {
    try {
      // Try direct download first
      const link = document.createElement('a');
      link.href = '/extension/growtools-extension.zip';
      link.download = 'growtools-extension.zip';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);

      // Fallback: try API route if direct download doesn't work
      setTimeout(async () => {
        try {
          const response = await fetch('/api/extension/download');
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const fallbackLink = document.createElement('a');
            fallbackLink.href = url;
            fallbackLink.download = 'growtools-extension.zip';
            fallbackLink.style.display = 'none';
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            window.URL.revokeObjectURL(url);
            setTimeout(() => {
              if (document.body.contains(fallbackLink)) {
                document.body.removeChild(fallbackLink);
              }
            }, 100);
          }
        } catch (apiError) {
          console.error('API download error:', apiError);
          // Final fallback: open in new tab
          window.open('/extension/growtools-extension.zip', '_blank');
        }
      }, 500);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab if download fails
      window.open('/extension/growtools-extension.zip', '_blank');
    }
  };

  if (isDismissed) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          setIsDismissed(false);
          setShowTutorial(true);
        }}
        className="mb-4"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Show Tutorial
      </Button>
    );
  }

  return (
    <>
      <Card className={`mb-6 border-2 ${isNewCustomer ? 'border-yellow-400 border-4 shadow-2xl' : 'border-blue-500'} bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 ${isNewCustomer ? 'animate-pulse-glow ring-4 ring-yellow-300' : 'animate-pulse-glow'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${isNewCustomer ? 'bg-yellow-500 animate-bounce' : 'bg-blue-500'} rounded-lg`}>
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  How to Use Your Tools
                  {isNewCustomer ? (
                    <Badge className="bg-yellow-400 text-yellow-900 animate-pulse text-base px-3 py-1">
                      ⭐ Welcome! Start Here
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-400 text-yellow-900 animate-pulse">
                      New
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {isNewCustomer 
                    ? "🎉 Welcome! Follow this guide to get started with your premium tools"
                    : "Quick guide to get started with your premium tools"}
                </CardDescription>
              </div>
            </div>
            {!isNewCustomer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowTutorial(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              View Tutorial
            </Button>
            <Button
              onClick={handleDownloadExtension}
              variant="outline"
              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Extension
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Modal */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <PlayCircle className="h-6 w-6 text-blue-600" />
              How to Use Your Tools - Complete Guide
            </DialogTitle>
            <DialogDescription>
              Follow these simple steps to access and use your premium tools
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Video Tutorial Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                  Video Tutorial
                </h3>
                <Button
                  onClick={() => window.open('https://youtu.be/DPBtd57p5Mg', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/DPBtd57p5Mg"
                  title="Browser Extension Installation Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                Watch this step-by-step video guide to install and use the extension
              </p>
            </div>
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Install Browser Extension</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Download and install the browser extension to enable automatic login to your tools.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Click the "Download Extension" button above</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Extract the ZIP file (if downloaded)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Open Chrome and go to <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">chrome://extensions/</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Enable "Developer mode" (toggle in top right)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Click "Load unpacked" and select the extension folder</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Access Your Tools</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Once the extension is installed, you can access any of your subscribed tools with one click.
                </p>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Go to your dashboard and find the tool you want to use</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Click the "Access Tool" button on the tool card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">The tool will open automatically in a new tab with your account logged in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Start Using Your Tools</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  You're all set! Your tools are ready to use with full premium access.
                </p>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">All premium features are unlocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">No login required - access is automatic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">Your session is secure and private</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Chrome className="h-5 w-5 text-blue-600" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Keep the extension enabled for seamless access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You can access tools multiple times - just click "Access Tool" again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>If a tool doesn't open, check that the extension is installed and enabled</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Contact support if you encounter any issues</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleDownloadExtension}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Extension
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTutorial(false)}
                className="flex-1"
              >
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
