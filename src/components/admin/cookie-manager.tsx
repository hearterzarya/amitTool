'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle, AlertCircle, Copy, Download, ExternalLink, Info } from "lucide-react";
import Link from "next/link";

interface CookieManagerProps {
  tool: {
    id: string;
    name: string;
    cookiesEncrypted?: string | null;
    cookiesUpdatedAt?: Date | null;
    cookiesExpiryDate?: Date | null;
  };
}

export function CookieManager({ tool }: CookieManagerProps) {
  const router = useRouter();
  const [cookies, setCookies] = useState("");
  const [expiryDate, setExpiryDate] = useState(
    tool.cookiesExpiryDate
      ? new Date(tool.cookiesExpiryDate).toISOString().split("T")[0]
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasCookies = !!tool.cookiesEncrypted;
  const cookiesExpired = tool.cookiesExpiryDate
    ? new Date(tool.cookiesExpiryDate) < new Date()
    : false;

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!cookies.trim()) {
      setError("Please paste cookies");
      return;
    }

    setLoading(true);

    try {
      // Try to parse cookies to validate JSON
      const parsedCookies = JSON.parse(cookies);

      if (!Array.isArray(parsedCookies)) {
        throw new Error("Cookies must be an array");
      }

      const response = await fetch(`/api/admin/tools/${tool.id}/cookies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookies: parsedCookies,
          expiryDate: expiryDate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save cookies");
      }

      setSuccess("Cookies saved successfully!");
      setCookies("");
      router.refresh();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your cookies.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyExample = () => {
    const example = JSON.stringify(
      [
        {
          name: "__Secure-next-auth.session-token",
          value: "your-session-token-here",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "Lax",
        },
      ],
      null,
      2
    );
    navigator.clipboard.writeText(example);
    setSuccess("Example copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Cookie Status:</span>
          <div className="flex items-center gap-2">
            {hasCookies && !cookiesExpired ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Configured
                </Badge>
              </>
            ) : hasCookies && cookiesExpired ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                  Expired
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <Badge variant="destructive">Not Configured</Badge>
              </>
            )}
          </div>
        </div>

        {tool.cookiesUpdatedAt && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {formatDate(tool.cookiesUpdatedAt)}
          </div>
        )}

        {tool.cookiesExpiryDate && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Expiry date: {formatDate(tool.cookiesExpiryDate)}
            {cookiesExpired && (
              <span className="text-orange-600 ml-2">(Expired!)</span>
            )}
          </div>
        )}
      </div>

      {/* Tool ID Display */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tool ID:</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-slate-100">
              {tool.id}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(tool.id);
                setSuccess("Tool ID copied to clipboard!");
                setTimeout(() => setSuccess(""), 2000);
              }}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Use this ID when uploading cookies via the admin extension
        </p>
      </div>

      {/* Admin Extension Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-2 border-purple-200 dark:border-purple-800 p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Use Admin Extension (Recommended)
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              Extract cookies directly from the browser with one click using our admin extension. Use the Tool ID above when uploading.
            </p>
            <Link href="/admin/extension">
              <Button
                type="button"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Get Admin Extension
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Manual Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
          Manual Method (Alternative):
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>Login to {tool.name} in your browser</li>
          <li>Open Developer Tools (F12)</li>
          <li>Go to Application → Cookies</li>
          <li>Export cookies as JSON (use extension like "EditThisCookie")</li>
          <li>Paste the JSON below</li>
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyExample}
          className="mt-2"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Example Format
        </Button>
      </div>

      {/* Cookie Input */}
      <div className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm p-3 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cookies">Cookies (JSON Array)</Label>
          <textarea
            id="cookies"
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            rows={10}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            placeholder={`[\n  {\n    "name": "session-token",\n    "value": "...",\n    "domain": ".example.com",\n    "path": "/",\n    "secure": true,\n    "httpOnly": true\n  }\n]`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Cookie Expiry Date (Optional)</Label>
          <input
            type="date"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <p className="text-xs text-gray-500">
            Set when these cookies will expire to get reminders
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save & Encrypt Cookies"}
        </Button>
      </div>
    </div>
  );
}
