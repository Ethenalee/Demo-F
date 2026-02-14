import type { Patient, AuditLog } from '@/types';
import { PatientStatusBadge } from './PatientStatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatDateTime, calculateAge } from '@/lib/utils';
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Home,
  Clock,
  Edit,
  History,
  Map as MapIcon,
  UserPlus,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface PatientDetailProps {
  patient: Patient;
  auditLogs: AuditLog[];
  onEdit: () => void;
  onClose: () => void;
}

function PatientMap({ address }: { address: Patient['address'] }) {
  return (
    <div className="bg-slate-100 rounded-lg h-[300px] flex items-center justify-center">
      <div className="text-center">
        <MapIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">Map View</p>
        <p className="text-slate-400 text-sm">{address.street}</p>
        <p className="text-slate-400 text-sm">{address.city}, {address.state} {address.zipCode}</p>
        <p className="text-xs text-slate-400 mt-2">
          (In production: Google Maps / Mapbox integration)
        </p>
      </div>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'UPDATE':
        return <Edit className="w-4 h-4 text-amber-500" />;
      case 'DELETE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'STATUS_CHANGE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Created';
      case 'UPDATE':
        return 'Updated';
      case 'DELETE':
        return 'Deleted';
      case 'STATUS_CHANGE':
        return 'Status Changed';
      default:
        return action;
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border">
        {getActionIcon(log.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900">{getActionLabel(log.action)}</span>
          {log.fieldName && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{log.fieldName}</span>
            </>
          )}
        </div>
        {log.oldValue !== undefined && log.newValue !== undefined && (
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="text-slate-500 line-through">{log.oldValue || '(empty)'}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-teal-600 font-medium">{log.newValue}</span>
          </div>
        )}
        {log.notes && (
          <p className="text-sm text-slate-600 mt-1">{log.notes}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatDateTime(log.performedAt)}</span>
          <span>•</span>
          <span>{log.performedBy}</span>
        </div>
      </div>
    </div>
  );
}

export function PatientDetail({ patient, auditLogs, onEdit, onClose }: PatientDetailProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
            {getInitials(patient.firstName, patient.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">
            {patient.firstName} {patient.middleName && `${patient.middleName} `}{patient.lastName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <PatientStatusBadge status={patient.status} />
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-sm">ID: {patient.id.slice(0, 8)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit} className="bg-teal-600 hover:bg-teal-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="history">
            History
            {auditLogs.length > 0 && (
              <span className="ml-2 bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                {auditLogs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User className="w-5 h-5 text-teal-600" />
              <h3>Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                <p className="font-medium text-slate-900">
                  {patient.firstName} {patient.middleName && `${patient.middleName} `}{patient.lastName}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </div>
                <p className="font-medium text-slate-900">
                  {formatDate(patient.dateOfBirth)}
                </p>
                <p className="text-sm text-slate-500">
                  {calculateAge(patient.dateOfBirth)} years old
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <p className="font-medium text-slate-900">
                  {patient.email || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </div>
                <p className="font-medium text-slate-900">
                  {patient.phone || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Home className="w-5 h-5 text-teal-600" />
              <h3>Address Information</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">{patient.address.street}</p>
                  <p className="text-slate-600">
                    {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                  </p>
                  <p className="text-slate-600">{patient.address.country}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3>System Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1">Created At</div>
                <p className="font-medium text-slate-900">{formatDateTime(patient.createdAt)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1">Last Updated</div>
                <p className="font-medium text-slate-900">{formatDateTime(patient.updatedAt)}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="location">
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">{patient.address.street}</p>
                  <p className="text-slate-600">
                    {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                  </p>
                  <p className="text-slate-600">{patient.address.country}</p>
                </div>
              </div>
            </div>
            <PatientMap address={patient.address} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <History className="w-5 h-5 text-teal-600" />
              <h3>Audit History</h3>
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No audit history</p>
                <p className="text-slate-400 text-sm">Changes to this patient will be logged here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <AuditLogItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
