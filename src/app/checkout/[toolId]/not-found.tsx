import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Card className="glass border-slate-200 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle className="text-3xl text-slate-900 mb-2">
              Tool Not Found
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              The tool you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              This could happen if:
            </p>
            <ul className="text-left text-slate-600 space-y-2 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>The tool ID is incorrect</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>The tool has been removed from our catalog</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>The tool is temporarily unavailable</span>
              </li>
            </ul>
            <div className="flex gap-4 justify-center pt-4">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <Link href="/tools">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Browse All Tools
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

