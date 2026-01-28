'use client';

import { Badge } from '@/components/ui/badge';
import { calculateSubscriptionStatus, getSubscriptionBadgeInfo, SubscriptionStatusInfo } from '@/lib/subscription-validation';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface SubscriptionStatusBadgeProps {
  currentPeriodEnd: Date;
  subscriptionStatus: string;
  activationStatus: string;
  showDaysRemaining?: boolean;
}

export function SubscriptionStatusBadge({
  currentPeriodEnd,
  subscriptionStatus,
  activationStatus,
  showDaysRemaining = true,
}: SubscriptionStatusBadgeProps) {
  const statusInfo = calculateSubscriptionStatus(
    currentPeriodEnd,
    subscriptionStatus,
    activationStatus
  );
  const badgeInfo = getSubscriptionBadgeInfo(statusInfo);

  const getIcon = () => {
    switch (statusInfo.status) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'EXPIRING_SOON':
        return <Clock className="h-3 w-3" />;
      case 'EXPIRED':
        return <XCircle className="h-3 w-3" />;
      case 'PENDING':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge
      variant={badgeInfo.variant}
      className={`${badgeInfo.className} flex items-center gap-1.5 text-xs font-medium`}
    >
      {getIcon()}
      <span>{badgeInfo.text}</span>
      {showDaysRemaining && statusInfo.daysRemaining !== null && statusInfo.status === 'ACTIVE' && (
        <span className="text-xs opacity-75">({statusInfo.daysRemaining} days)</span>
      )}
    </Badge>
  );
}
