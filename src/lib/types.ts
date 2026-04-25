export type UserRole = 'dealer' | 'electrician';
export type AdminRole = 'super_admin' | 'admin' | 'staff';
export type MemberTier = 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
export type UserStatus = 'active' | 'pending' | 'inactive';
export type ScanMode = 'single' | 'multi';

export interface RolePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
}

export type ElectricianSubCategory =
  | 'General Electrician'
  | 'Industrial Electrician'
  | 'Residential Wiring'
  | 'Solar Installer'
  | 'AC/Appliance Technician'
  | 'Panel Board Specialist'
  | 'Lighting Specialist'
  | 'Contractor';

export interface Electrician {
  id: string;
  name: string;
  profileImage?: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  district: string;
  electricianCode: string;
  tier: MemberTier;
  totalPoints: number;
  totalScans: number;
  joinedDate: string;
  status: UserStatus;
  dealerId: string;
  dealerName: string;
  bankLinked: boolean;
  upiId?: string;
  bankAccount?: string;
  ifsc?: string;
  recentActivity: string;
  walletBalance: number;
  totalRedemptions: number;
  subCategory: ElectricianSubCategory;
}

export interface Dealer {
  id: string;
  name: string;
  profileImage?: string;
  phone: string;
  email?: string;
  dealerCode: string;
  town: string;
  district: string;
  state: string;
  address: string;
  pincode?: string;
  tier: MemberTier;
  electricianCount: number;
  status: UserStatus;
  joinedDate: string;
  gstNumber: string;
  bankLinked: boolean;
  upiId?: string;
  totalOrders?: number;
  monthlyTarget?: number;
  achievedTarget?: number;
  contactPerson?: string;
}

export interface Product {
  id: string;
  name: string;
  sub: string;
  category: string;
  subCategory?: string;
  image: string;
  points: number;
  badge: string;
  price: string;
  mrp?: string;
  stock: number;
  totalScanned: number;
  sku?: string;
  weight?: string;
  description?: string;
  isActive: boolean;
}

export interface Reward {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  type: string;
  points: number;
  status: 'approved' | 'pending' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  upiId?: string;
  bankAccount?: string;
  amount?: number;
}

export interface ScanRecord {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  productName: string;
  productId: string;
  points: number;
  mode: ScanMode;
  scannedAt: string;
  location: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetRole: UserRole | 'all';
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
  openRate?: number;
}

export interface DashboardStats {
  totalElectricians: number;
  totalDealers: number;
  totalScansToday: number;
  totalPointsAwarded: number;
  pendingRedemptions: number;
  activeUsers: number;
  revenueThisMonth: number;
  growthRate: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  targetRole: UserRole | 'all';
  status: 'active' | 'expired' | 'scheduled';
  productCategory?: string;
  bonusPoints?: number;
}

export interface PointsConfig {
  id: string;
  productId: string;
  productName: string;
  basePoints: number;
  bonusPoints: number;
  isActive: boolean;
  updatedAt: string;
}

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  targetRole: UserRole | 'all';
  linkUrl?: string;
  status: 'active' | 'inactive';
  order: number;
  createdAt: string;
}
