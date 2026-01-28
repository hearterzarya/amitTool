'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Chrome, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccessToolButtonProps {
  tool: {
    id: string;
    name: string;
    toolUrl: string;
    cookiesEncrypted?: string | null;
  };
}

export function AccessToolButton({ tool }: AccessToolButtonProps) {
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAccessTool = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // First check subscription status
      const subscriptionResponse = await fetch(`/api/subscriptions/check?toolId=${tool.id}`);
      if (subscriptionResponse.ok) {
        const subData = await subscriptionResponse.json();
        if (subData.success && subData.subscription) {
          const sub = subData.subscription;
          const now = new Date();
          const expiryDate = new Date(sub.currentPeriodEnd);
          
          // Check if subscription is expired
          if (expiryDate < now) {
            alert('Your subscription has expired. Please renew to continue accessing this tool.');
            setLoading(false);
            return;
          }
          
          // Check if subscription is expiring soon (3 days or less)
          const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 3 && daysRemaining > 0) {
            const shouldContinue = confirm(
              `Your subscription expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Continue?`
            );
            if (!shouldContinue) {
              setLoading(false);
              return;
            }
          }
          
          // Check activation status
          if (sub.activationStatus === 'PENDING') {
            alert('Your subscription is pending activation. You will receive confirmation via Email or WhatsApp.');
            setLoading(false);
            return;
          }
          
          if (sub.activationStatus === 'SUSPENDED') {
            alert('Your subscription has been suspended. Please contact support.');
            setLoading(false);
            return;
          }
        } else {
          alert('You do not have an active subscription for this tool.');
          setLoading(false);
          return;
        }
      }

      // Check if extension is installed
      const hasExtension = await checkExtension();

      if (!hasExtension) {
        setShowExtensionModal(true);
        setLoading(false);
        return;
      }

      // Fetch cookies from API
      const response = await fetch(`/api/cookies/${tool.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch cookies";
        
        // Provide specific error messages
        if (response.status === 404 && errorMessage.includes("not configured")) {
          throw new Error("Cookies are not configured for this tool. Please contact support.");
        } else if (response.status === 403) {
          throw new Error("You don't have access to this tool. Please check your subscription.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const { cookies, url } = await response.json();

      // Send message to extension via window.postMessage
      // The content script will forward it to the background script
      window.postMessage(
        {
          type: "GROWTOOLS_ACCESS",
          toolId: tool.id,
          url: url,
          cookies: cookies,
        },
        "*"
      );

      // Listen for success/error response from extension
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === "GROWTOOLS_ACCESS_SUCCESS" && event.data.toolId === tool.id) {
          setSuccess(true);
          setLoading(false);
          window.removeEventListener("message", messageHandler);
          // Reset success state after 2 seconds
          setTimeout(() => setSuccess(false), 2000);
        } else if (event.data.type === "GROWTOOLS_ACCESS_ERROR" && event.data.toolId === tool.id) {
          setLoading(false);
          window.removeEventListener("message", messageHandler);
          alert(`Failed to access tool: ${event.data.error || "Unknown error"}`);
        }
      };

      window.addEventListener("message", messageHandler);

      // Timeout after 10 seconds (increased for slower connections)
      setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        if (loading) {
          setLoading(false);
          // Assume success if no error (tool might have opened)
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        }
      }, 10000);
    } catch (error: any) {
      console.error("Error accessing tool:", error);
      setLoading(false);
      alert(error.message || "Failed to access tool. Please try again.");
    }
  };

  const checkExtension = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Try to communicate with extension via window.postMessage
      // The content script will respond if extension is installed
      try {
        window.postMessage({ type: "GROWTOOLS_CHECK" }, "*");

        // Wait for response (timeout after 2 seconds to give extension time to respond)
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          console.log("Extension check timeout - extension may not be installed");
          resolve(false);
        }, 2000);

        const handler = (event: MessageEvent) => {
          // Only accept messages from same window
          if (event.source !== window) return;
          
          if (event.data && event.data.type === "GROWTOOLS_INSTALLED") {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            console.log("Extension detected!");
            resolve(true);
          }
        };

        window.addEventListener("message", handler);
      } catch (error) {
        console.error("Error checking for extension:", error);
        resolve(false);
      }
    });
  };

  return (
    <>
      <Button
        className="w-full"
        onClick={handleAccessTool}
        disabled={loading || !tool.cookiesEncrypted}
        variant={success ? "default" : "default"}
      >
        {loading ? (
          "Opening..."
        ) : success ? (
          "✓ Opened!"
        ) : !tool.cookiesEncrypted ? (
          "Cookies not configured"
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Access Tool
          </>
        )}
      </Button>

      {/* Extension Required Modal */}
      <Dialog open={showExtensionModal} onOpenChange={setShowExtensionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Chrome className="h-6 w-6 text-primary" />
              Extension Required
            </DialogTitle>
            <DialogDescription>
              To access your tools, you need to install the extension

 Browser Extension.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Install the browser extension</li>
                <li>Click "Access Tool" button</li>
                <li>Tool opens automatically with your account logged in</li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Installation Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                <li>Download the extension from the extension folder</li>
                <li>Open Chrome and go to chrome://extensions/</li>
                <li>Enable "Developer mode" (top right)</li>
                <li>Click "Load unpacked" and select the extension folder</li>
                <li>Refresh this page and try again</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={async () => {
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
                }}
                className="flex-1"
              >
                <Chrome className="h-4 w-4 mr-2" />
                Download Extension
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://youtu.be/DPBtd57p5Mg', '_blank')}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
              <Button variant="outline" onClick={() => setShowExtensionModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
