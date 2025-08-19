import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  DollarSign,
  TrendingUp,
  Save,
  X,
  Calculator,
} from 'lucide-react';
import { CustomerData, CreateCustomerData, UpdateCustomerData } from '@/types/customer';
import { formatCurrency } from '@/lib/utils';

const customerFormSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  address: z.string().min(10, 'ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร'),
  idCard: z.string().min(13, 'เลขบัตรประชาชนต้องมี 13 หลัก').max(13, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  occupation: z.string().min(2, 'อาชีพต้องมีอย่างน้อย 2 ตัวอักษร'),
  monthlyIncome: z.number().min(1, 'รายได้ต้องมากกว่า 0'),
  creditScore: z.number().min(300, 'คะแนนเครดิตต้องอยู่ระหว่าง 300-850').max(850, 'คะแนนเครดิตต้องอยู่ระหว่าง 300-850').optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: CustomerData;
  onSubmit: (data: CreateCustomerData | UpdateCustomerData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

const occupationOptions = [
  'พนักงานบริษัท',
  'ข้าราชการ',
  'พนักงานรัฐวิสาหกิจ',
  'ค้าขาย',
  'อิสระ',
  'เกษตรกร',
  'รับจ้าง',
  'นักเรียน/นักศึกษา',
  'เกษียณ',
  'อื่นๆ',
];

const calculateCreditScore = (income: number, occupation: string): number => {
  let score = 500; // Base score

  // Income factor
  if (income >= 50000) score += 150;
  else if (income >= 30000) score += 100;
  else if (income >= 20000) score += 50;
  else if (income >= 15000) score += 25;

  // Occupation factor
  const stableOccupations = ['ข้าราชการ', 'พนักงานรัฐวิสาหกิจ', 'พนักงานบริษัท'];
  const riskOccupations = ['ค้าขาย', 'อิสระ', 'รับจ้าง'];
  
  if (stableOccupations.includes(occupation)) score += 100;
  else if (riskOccupations.includes(occupation)) score -= 50;

  return Math.min(850, Math.max(300, score));
};

const getRiskLevel = (creditScore: number): 'low' | 'medium' | 'high' => {
  if (creditScore >= 700) return 'low';
  if (creditScore >= 600) return 'medium';
  return 'high';
};

const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
  }
};

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}: CustomerFormProps) {
  const [calculatedCreditScore, setCalculatedCreditScore] = useState<number | null>(null);
  const [estimatedRiskLevel, setEstimatedRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      idCard: customer?.idCard || '',
      occupation: customer?.occupation || '',
      monthlyIncome: customer?.monthlyIncome || 0,
      creditScore: customer?.creditScore || undefined,
      notes: customer?.notes || '',
    },
  });

  const watchedIncome = form.watch('monthlyIncome');
  const watchedOccupation = form.watch('occupation');
  const watchedCreditScore = form.watch('creditScore');

  // Calculate credit score when income or occupation changes
  useEffect(() => {
    if (watchedIncome > 0 && watchedOccupation && mode === 'create') {
      const score = calculateCreditScore(watchedIncome, watchedOccupation);
      setCalculatedCreditScore(score);
      setEstimatedRiskLevel(getRiskLevel(score));
      form.setValue('creditScore', score);
    }
  }, [watchedIncome, watchedOccupation, mode, form]);

  // Update risk level when credit score changes
  useEffect(() => {
    if (watchedCreditScore) {
      setEstimatedRiskLevel(getRiskLevel(watchedCreditScore));
    }
  }, [watchedCreditScore]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      const submitData = {
        ...data,
        email: data.email || undefined,
        creditScore: data.creditScore || calculatedCreditScore || 500,
        riskLevel: estimatedRiskLevel || 'medium',
      };

      if (mode === 'edit' && customer) {
        await onSubmit(submitData as UpdateCustomerData);
      } else {
        await onSubmit(submitData as CreateCustomerData);
      }
    } catch (error) {
      console.error('Error submitting customer form:', error);
    }
  };

  const formatIdCard = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as X-XXXX-XXXXX-XX-X
    if (digits.length <= 1) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
    if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12, 13)}`;
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XXX-XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'create' ? 'เพิ่มลูกค้าใหม่' : 'แก้ไขข้อมูลลูกค้า'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'กรอกข้อมูลลูกค้าใหม่ เพื่อเพิ่มเข้าสู่ระบบ'
            : 'แก้ไขข้อมูลลูกค้าที่มีอยู่ในระบบ'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                ข้อมูลส่วนตัว
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ-นามสกุล *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรอกชื่อ-นามสกุล" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="idCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลขบัตรประชาชน *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="X-XXXX-XXXXX-XX-X"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatIdCard(e.target.value);
                            field.onChange(formatted.replace(/\D/g, ''));
                          }}
                          value={formatIdCard(field.value)}
                          maxLength={17}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                ข้อมูลติดต่อ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์ *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XXX-XXX-XXXX"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted.replace(/\D/g, ''));
                          }}
                          value={formatPhoneNumber(field.value)}
                          maxLength={12}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อีเมล</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่ *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="กรอกที่อยู่ที่สามารถติดต่อได้"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                ข้อมูลทางการเงิน
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อาชีพ *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกอาชีพ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {occupationOptions.map((occupation) => (
                            <SelectItem key={occupation} value={occupation}>
                              {occupation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายได้ต่อเดือน *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.value > 0 && `${formatCurrency(field.value)} ต่อเดือน`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="creditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      คะแนนเครดิต
                      {mode === 'create' && calculatedCreditScore && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (calculatedCreditScore) {
                              form.setValue('creditScore', calculatedCreditScore);
                            }
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          ใช้คะแนนที่คำนวณ ({calculatedCreditScore})
                        </Button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="300-850"
                        min={300}
                        max={850}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="flex items-center gap-2">
                      คะแนนเครดิตระหว่าง 300-850
                      {estimatedRiskLevel && (
                        <Badge
                          variant="outline"
                          className={`${getRiskLevelColor(estimatedRiskLevel)} text-xs`}
                        >
                          ความเสี่ยง: {estimatedRiskLevel === 'low' ? 'ต่ำ' : estimatedRiskLevel === 'medium' ? 'กลาง' : 'สูง'}
                        </Badge>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">ข้อมูลเพิ่มเติม</h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับลูกค้า"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'เพิ่มลูกค้า' : 'บันทึกการแก้ไข'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}