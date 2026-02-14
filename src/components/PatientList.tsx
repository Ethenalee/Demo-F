import { useState } from 'react';
import type { Patient, PatientStatus, SortOption, AuditLog } from '@/types';
import { PatientStatus as PatientStatusConst } from '@/types';
import { usePatientStore } from '@/hooks/usePatientStore';
import { PatientStatusBadge } from './PatientStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  MapPin
} from 'lucide-react';
import { formatDate, calculateAge, cn, downloadCSV, exportToPDF } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PatientForm } from './PatientForm';
import { PatientDetail } from './PatientDetail';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function PatientList() {
  const {
    patients,
    filter,
    sort,
    pagination,
    setFilter,
    setSort,
    setPagination,
    addPatient,
    updatePatient,
    deletePatient,
    getAuditLogsForPatient,
    getFilteredPatients,
    getPaginatedPatients,
    exportToCSV,
  } = usePatientStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [viewingPatientAuditLogs, setViewingPatientAuditLogs] = useState<AuditLog[]>([]);

  const filteredPatients = getFilteredPatients();
  const paginatedPatients = getPaginatedPatients();
  const totalPages = Math.ceil(filteredPatients.length / pagination.pageSize);

  const handleSort = (field: SortOption['field']) => {
    setSort({
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleAddPatient = async (data: Parameters<typeof addPatient>[0]) => {
    try {
      await addPatient(data);
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to add patient:', error);
    }
  };

  const handleEditPatient = async (data: Parameters<typeof updatePatient>[1]) => {
    if (editingPatient) {
      try {
        await updatePatient(editingPatient.id, data);
        setIsEditDialogOpen(false);
        setEditingPatient(null);
      } catch (error) {
        // Error is handled by the store
        console.error('Failed to update patient:', error);
      }
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
      try {
        await deletePatient(patient.id);
      } catch (error) {
        // Error is handled by the store
        console.error('Failed to delete patient:', error);
      }
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setViewingPatient(patient);
    setIsDetailDialogOpen(true);
    // Fetch audit logs for this patient
    const logs = await getAuditLogsForPatient(patient.id);
    setViewingPatientAuditLogs(logs);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      const csv = await exportToCSV();
      downloadCSV(csv, `patients-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const handleExportPDF = () => {
    exportToPDF(filteredPatients, `patients-${new Date().toISOString().split('T')[0]}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getSortIcon = (field: SortOption['field']) => {
    if (sort.field !== field) {
      return <ChevronUp className="w-4 h-4 text-slate-300" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-teal-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-teal-600" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">
            Manage your patients and track their status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search patients by name, email, or phone..."
            value={filter.searchQuery}
            onChange={(e) => setFilter({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          value={filter.status}
          onValueChange={(value) => setFilter({ status: value as PatientStatus | 'ALL' })}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value={PatientStatusConst.INQUIRY}>Inquiry</SelectItem>
            <SelectItem value={PatientStatusConst.ONBOARDING}>Onboarding</SelectItem>
            <SelectItem value={PatientStatusConst.ACTIVE}>Active</SelectItem>
            <SelectItem value={PatientStatusConst.CHURNED}>Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: patients.length, color: 'bg-slate-100' },
          { label: 'Inquiry', value: patients.filter(p => p.status === PatientStatusConst.INQUIRY).length, color: 'bg-amber-50' },
          { label: 'Active', value: patients.filter(p => p.status === PatientStatusConst.ACTIVE).length, color: 'bg-emerald-50' },
          { label: 'Onboarding', value: patients.filter(p => p.status === PatientStatusConst.ONBOARDING).length, color: 'bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
            <p className="text-sm text-slate-600">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Patient Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Added
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-medium">No patients found</p>
                      <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                          {getInitials(patient.firstName, patient.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {patient.firstName} {patient.middleName && `${patient.middleName} `}{patient.lastName}
                      </div>
                      {patient.email && (
                        <div className="text-sm text-slate-500">{patient.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(patient.dateOfBirth)}</div>
                      <div className="text-sm text-slate-500">{calculateAge(patient.dateOfBirth)} years old</div>
                    </TableCell>
                    <TableCell>
                      <PatientStatusBadge status={patient.status} />
                    </TableCell>
                    <TableCell>
                      {patient.phone && (
                        <div className="text-sm">{patient.phone}</div>
                      )}
                      {!patient.phone && patient.email && (
                        <div className="text-sm text-slate-500">{patient.email}</div>
                      )}
                      {!patient.phone && !patient.email && (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {patient.address.city}, {patient.address.state}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(patient.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(patient)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePatient(patient)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredPatients.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, filteredPatients.length)} of{' '}
            {filteredPatients.length} patients
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPagination({ page })}
                  className={cn(
                    "w-8",
                    pagination.page === page && "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ page: pagination.page + 1 })}
              disabled={pagination.page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSubmit={handleAddPatient}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <PatientForm
              patient={editingPatient}
              onSubmit={handleEditPatient}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingPatient(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {viewingPatient && (
            <PatientDetail
              patient={viewingPatient}
              auditLogs={viewingPatientAuditLogs}
              onEdit={() => {
                setIsDetailDialogOpen(false);
                handleEditClick(viewingPatient);
              }}
              onClose={() => {
                setIsDetailDialogOpen(false);
                setViewingPatient(null);
                setViewingPatientAuditLogs([]);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
