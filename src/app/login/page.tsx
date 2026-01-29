'use client';

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { brand } from "@/lib/brand";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check for success messages and errors from query params
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess("Email verified successfully! You can now login.");
      setTimeout(() => setSuccess(""), 5000);
    }
    if (searchParams.get('passwordReset') === 'true') {
      setSuccess("Password reset successfully! You can now login with your new password.");
      setTimeout(() => setSuccess(""), 5000);
    }
    
    // Handle OAuth errors
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = 'An error occurred during sign-in. Please try again.';
      
      switch (errorParam) {
        case 'Callback':
        case 'OAuthCallback':
          errorMessage = 'OAuth callback failed. This might be due to a configuration issue. Please try again or contact support.';
          break;
        case 'OAuthAccountNotLinked':
          errorMessage = 'An account with this email already exists. Please sign in with your password instead.';
          break;
        case 'OAuthCreateAccount':
          errorMessage = 'Failed to create account. Please try again or contact support.';
          break;
        case 'Configuration':
          errorMessage = 'Authentication is not properly configured. Please contact support.';
          break;
        default:
          errorMessage = `Sign-in error: ${errorParam}. Please try again.`;
      }
      
      setError(errorMessage);
      // Clear error after 10 seconds
      setTimeout(() => setError(""), 10000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED") {
          setEmailNotVerified(true);
          setError("Please verify your email before logging in. Check your inbox for the verification code.");
        } else {
          setError("Invalid email or password");
          setEmailNotVerified(false);
        }
      } else {
        // Give the browser time to apply the session cookie from signIn response
        await new Promise((r) => setTimeout(r, 200));
        let session = await getSession();
        if (!session) {
          await new Promise((r) => setTimeout(r, 300));
          session = await getSession();
        }
        const userRole = (session?.user as { role?: string })?.role;
        const target = userRole === 'ADMIN' ? '/admin' : '/dashboard';
        // Full page redirect so the next request sends the cookie (fixes Vercel/production)
        window.location.href = target;
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/50 to-blue-100/50 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-slate-300/[0.03] bg-[size:75px_75px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Link href="/" className="inline-flex items-center space-x-3 group mb-4">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-purple-400 group-hover:text-purple-300 transition-colors animate-pulse" />
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-3xl font-bold brand-gradient-text">{brand.name}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">
            Sign in to access your premium tools
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 border border-slate-200 shadow-2xl backdrop-blur-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-700 text-sm p-4 rounded-lg flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className={`${emailNotVerified ? 'bg-orange-500/10 border-orange-500/50 text-orange-700' : 'bg-red-500/10 border-red-500/50 text-red-300'} text-sm p-4 rounded-lg space-y-3 animate-fade-in`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 ${emailNotVerified ? 'bg-orange-400' : 'bg-red-400'} rounded-full animate-pulse`} />
                  <span>{error}</span>
                </div>
                {emailNotVerified && (
                  <div className="space-y-2 pt-2 border-t border-orange-500/20">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setResendLoading(true);
                        setResendSuccess(false);
                        try {
                          const response = await fetch('/api/auth/resend-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setResendSuccess(true);
                            setTimeout(() => {
                              router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
                            }, 1500);
                          } else {
                            setError(data.error || "Failed to resend code");
                          }
                        } catch (err) {
                          setError("Failed to resend code. Please try again.");
                        } finally {
                          setResendLoading(false);
                        }
                      }}
                      disabled={resendLoading}
                      className="w-full text-xs"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : resendSuccess ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-2" />
                          Code sent! Redirecting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Resend Verification Code
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(email)}`)}
                      className="w-full text-xs"
                    >
                      Or verify manually →
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 pl-4 pr-4"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-base shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <GoogleSignInButton 
            text="Sign in with Google"
            className="mb-4"
            callbackUrl="/dashboard"
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">New to {brand.name}?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link href="/register">
            <Button
              variant="outline"
              className="w-full h-12 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300"
            >
              Create an Account
            </Button>
          </Link>
        </div>

        {/* Footer Links */}
        <p className="mt-8 text-center text-sm text-slate-600 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-purple-600 hover:text-purple-700 transition-colors underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-purple-600 hover:text-purple-700 transition-colors underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
