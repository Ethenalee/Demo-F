import { useState, useEffect } from 'react';
import type { Patient, PatientStatus, PatientFormData } from '@/types';
import { PatientStatus as PatientStatusConst } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validatePatientData, validateAddress, cn } from '@/lib/utils';
import { MapPin, User, Mail, Phone, Calendar, Home } from 'lucide-react';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormData) => void;
  onCancel: () => void;
}

const initialFormData: PatientFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  status: PatientStatusConst.INQUIRY,
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  },
};

export function PatientForm({ patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        middleName: patient.middleName || '',
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        status: patient.status,
        email: patient.email || '',
        phone: patient.phone || '',
        address: {
          street: patient.address.street,
          city: patient.address.city,
          state: patient.address.state,
          zipCode: patient.address.zipCode,
          country: patient.address.country,
        },
      });
    }
  }, [patient]);

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field: keyof PatientFormData['address'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    setTouched((prev) => ({ ...prev, [`address.${field}`]: true }));
    
    if (errors[`address.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`address.${field}`];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patientValidation = validatePatientData({
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      email: formData.email,
      phone: formData.phone,
    });

    const addressValidation = validateAddress(formData.address);

    const allErrors = {
      ...patientValidation.errors,
      ...Object.entries(addressValidation.errors).reduce((acc, [key, value]) => {
        acc[`address.${key}`] = value;
        return acc;
      }, {} as Record<string, string>),
    };

    if (!patientValidation.isValid || !addressValidation.isValid) {
      setErrors(allErrors);
      setTouched(
        Object.keys(allErrors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
      return;
    }

    onSubmit(formData);
  };

  const getFieldError = (field: string) => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <User className="w-5 h-5 text-teal-600" />
          <h3>Personal Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Enter first name"
              className={cn(
                getFieldError('firstName') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('firstName') && (
              <p className="text-sm text-red-500">{getFieldError('firstName')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange('middleName', e.target.value)}
              placeholder="Enter middle name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Enter last name"
              className={cn(
                getFieldError('lastName') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('lastName') && (
              <p className="text-sm text-red-500">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={cn(
                  "pl-10",
                  getFieldError('dateOfBirth') && "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {getFieldError('dateOfBirth') && (
              <p className="text-sm text-red-500">{getFieldError('dateOfBirth')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value as PatientStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PatientStatusConst.INQUIRY}>Inquiry</SelectItem>
                <SelectItem value={PatientStatusConst.ONBOARDING}>Onboarding</SelectItem>
                <SelectItem value={PatientStatusConst.ACTIVE}>Active</SelectItem>
                <SelectItem value={PatientStatusConst.CHURNED}>Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </div>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              className={cn(
                getFieldError('email') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('email') && (
              <p className="text-sm text-red-500">{getFieldError('email')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone Number
              </div>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={cn(
                getFieldError('phone') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('phone') && (
              <p className="text-sm text-red-500">{getFieldError('phone')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Home className="w-5 h-5 text-teal-600" />
          <h3>Address Information</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">
            Street Address <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="Enter street address"
              className={cn(
                "pl-10",
                getFieldError('address.street') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
          {getFieldError('address.street') && (
            <p className="text-sm text-red-500">{getFieldError('address.street')}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Enter city"
              className={cn(
                getFieldError('address.city') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('address.city') && (
              <p className="text-sm text-red-500">{getFieldError('address.city')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="state"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="Enter state"
              className={cn(
                getFieldError('address.state') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('address.state') && (
              <p className="text-sm text-red-500">{getFieldError('address.state')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">
              ZIP Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="zipCode"
              value={formData.address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="Enter ZIP code"
              className={cn(
                getFieldError('address.zipCode') && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {getFieldError('address.zipCode') && (
              <p className="text-sm text-red-500">{getFieldError('address.zipCode')}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-red-500">*</span>
          </Label>
          <Input
            id="country"
            value={formData.address.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            placeholder="Enter country"
            className={cn(
              getFieldError('address.country') && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {getFieldError('address.country') && (
            <p className="text-sm text-red-500">{getFieldError('address.country')}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
        >
          {patient ? 'Update Patient' : 'Add Patient'}
        </Button>
      </div>
    </form>
  );
}
