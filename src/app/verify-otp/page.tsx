'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { brand } from "@/lib/brand";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const userId = searchParams.get('userId') || '';
  const autoLogin = searchParams.get('autoLogin') === 'true';

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Handle OTP input with paste support
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedOtp.length && index + i < 6; i++) {
        newOtp[index + i] = pastedOtp[i];
      }
      setOtp(newOtp);
      // Focus next empty input or submit
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '').slice(0, 1);
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode,
          userId: userId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid verification code");
        setLoading(false);
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        document.getElementById('otp-0')?.focus();
        return;
      }

      setSuccess(true);

      // Auto-login if requested
      if (autoLogin && email) {
        // Get password from session storage (set during registration)
        const tempPassword = sessionStorage.getItem('temp_password');
        if (tempPassword) {
          sessionStorage.removeItem('temp_password');
          try {
            const loginResult = await signIn('credentials', {
              email,
              password: tempPassword,
              redirect: false,
            });
            
            if (!loginResult?.error) {
              // Login successful, redirect to dashboard
              setTimeout(() => {
                router.push('/dashboard');
                router.refresh();
              }, 1500);
              return;
            }
          } catch (loginError) {
            // If auto-login fails, continue to login page
            console.log('Auto-login failed, redirecting to login page');
          }
        }
      }

      // Redirect to login with success message
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId: userId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        if (data.retryAfter) {
          setResendCooldown(data.retryAfter);
        }
      } else {
        setResendCooldown(60); // 60 second cooldown
        setError(""); // Clear any previous errors
      }
    } catch (error) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById('otp-0')?.focus();
  }, []);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Request</h2>
          <p className="text-gray-600 mb-4">Email address is required for verification.</p>
          <Button asChild>
            <Link href="/register">Go to Registration</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-float-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-4">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-purple-400 group-hover:text-purple-300 transition-colors animate-pulse" />
            </div>
            <span className="text-3xl font-bold brand-gradient-text">{brand.name}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-slate-600">
            Enter the 6-digit code sent to
          </p>
          <p className="text-slate-900 font-semibold mt-1">{email}</p>
        </div>

        {/* Verification Card */}
        <div className="glass rounded-2xl p-8 border border-slate-200 shadow-2xl backdrop-blur-xl">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-scale-in" />
              <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
              <p className="text-slate-600">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-700 text-sm p-4 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-3">
                <Label className="text-slate-700 flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Verification Code</span>
                </Label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-purple-500 focus:ring-purple-500"
                      disabled={loading}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Paste the code or type each digit
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>Verify Email</span>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-sm"
                >
                  {resendLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
