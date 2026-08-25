export type PaymentStatus = "PENDING" | "PAID" | "REJECTED" | "EXPIRED" | "CANCELLED" | "REFUNDED";

export interface PaymentTransferInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrData: string;
}

export interface Payment {
  _id: string;
  enrollmentId: any; // Can be string or populated Enrollment object
  studentId: any;
  courseId: any;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  transferInfo: PaymentTransferInfo;
  paidAt: string | null;
  verifiedBy: any | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConfig {
  _id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferPrefix: string;
  isActive: boolean;
}
