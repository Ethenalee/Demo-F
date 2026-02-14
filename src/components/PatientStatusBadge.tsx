import type { PatientStatus } from '@/types';
import { PatientStatus as PatientStatusConst } from '@/types';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  UserPlus, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

interface PatientStatusBadgeProps {
  status: PatientStatus;
  showIcon?: boolean;
}

export function PatientStatusBadge({ status, showIcon = true }: PatientStatusBadgeProps) {
  const getStatusConfig = (status: PatientStatus) => {
    switch (status) {
      case PatientStatusConst.INQUIRY:
        return {
          className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
          icon: HelpCircle,
          label: 'Inquiry'
        };
      case PatientStatusConst.ONBOARDING:
        return {
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          icon: UserPlus,
          label: 'Onboarding'
        };
      case PatientStatusConst.ACTIVE:
        return {
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          icon: CheckCircle,
          label: 'Active'
        };
      case PatientStatusConst.CHURNED:
        return {
          className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
          icon: XCircle,
          label: 'Churned'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: HelpCircle,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} font-medium capitalize`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
      {config.label}
    </Badge>
  );
}
