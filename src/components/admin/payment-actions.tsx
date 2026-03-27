"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface PaymentActionsProps {
    paymentId: string;
    status: string;
}

export function PaymentActions({ paymentId, status }: PaymentActionsProps) {
    const [loading, setLoading] = useState(false);
    const [actionStatus, setActionStatus] = useState(status);

    const handleAction = async (action: "approve" | "reject") => {
        if (!confirm(`Are you sure you want to ${action} this payment?`)) return;

        setLoading(true);
        try {
            const response = await fetch("/api/admin/payments/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, action }),
            });

            const data = await response.json();

            if (data.success) {
                setActionStatus(action === "approve" ? "SUCCESS" : "FAILED");
                window.location.reload(); // Refresh to see updates
            } else {
                alert(data.error || "Action failed");
            }
        } catch (error) {
            console.error("Error performing action:", error);
            alert("Error performing action");
        } finally {
            setLoading(false);
        }
    };

    if (actionStatus === "SUCCESS") {
        return (
            <div className="flex items-center text-green-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approved
            </div>
        );
    }

    if (actionStatus === "FAILED" || actionStatus === "REJECTED_BY_ADMIN") {
        return (
            <div className="flex items-center text-red-600 text-sm font-medium">
                <XCircle className="h-4 w-4 mr-1" /> Rejected
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                className="h-8 border-green-200 hover:bg-green-50 text-green-700"
                onClick={() => handleAction("approve")}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Approve
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="h-8 border-red-200 hover:bg-red-50 text-red-700"
                onClick={() => handleAction("reject")}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                Reject
            </Button>
        </div>
    );
}
