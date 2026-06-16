export type UserRole = 'dealer' | 'electrician' | 'user' | 'counterboy';
export type AdminRole = 'super_admin' | 'admin' | 'staff';
export type MemberTier = 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
export type UserStatus = 'active' | 'pending' | 'inactive' | 'suspended';
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
  bankName?: string;
  accountHolderName?: string;
  kycStatus?: string;
  aadharNumber?: string;
  panNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  hasPassword?: boolean;
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
  bonusPoints?: number;
  bonusStatus?: string;
  contactPerson?: string;
  salesManName?: string;
  townCode?: string;
  rtoCode?: string;
  listCode?: string;
  electricianList?: string;
  kycStatus?: string;
  aadharNumber?: string;
  panNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  hasPassword?: boolean;
}

export interface CustomerActivityInsight {
  user: Record<string, unknown>;
  summary: {
    scans: number;
    cartItems: number;
    productOrders: number;
    walletTransactions: number;
    appEvents?: number;
    linkedElectricians?: number;
    favoriteProduct: string;
    lastActivityAt: string | null;
  };
  productInterests: Array<{
    productId: string;
    productName: string;
    category?: string;
    scanCount: number;
    pointsEarned: number;
    cartQuantity: number;
    orderQuantity: number;
    viewCount?: number;
    durationMs?: number;
    intentScore: number;
  }>;
  recentTimeline: Array<{
    id: string;
    type: 'scan' | 'cart' | 'order' | 'wallet' | 'screen_view' | 'screen_time' | 'product_view' | 'product_add_to_cart' | 'product_buy_now' | 'profile_view' | 'button_tap';
    title: string;
    detail: string;
    productName?: string;
    occurredAt: string;
  }>;
  note: string;
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

export interface AppUser {
  id: string;
  name: string;
  profileImage?: string;
  phone: string;
  email?: string;
  userCode: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  tier: MemberTier;
  totalPoints: number;
  walletBalance: number;
  totalRedemptions: number;
  status: UserStatus;
  kycStatus: string;
  bankLinked: boolean;
  upiId?: string;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  accountHolderName?: string;
  aadharNumber?: string;
  panNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  appInstalled?: boolean;
  firstAppLoginAt?: string | null;
  joinedDate: string;
  hasPassword?: boolean;
}

export interface AppIcon {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounterBoy {
  id: string;
  name: string;
  profileImage?: string;
  phone: string;
  email?: string;
  counterboyCode: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  dealerId?: string;
  dealerName?: string;
  dealerPhone?: string;
  dealerCode?: string;
  totalScans: number;
  totalPoints: number;
  walletBalance: number;
  totalRedemptions: number;
  bankLinked: boolean;
  upiId?: string;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  accountHolderName?: string;
  tier?: MemberTier;
  recentActivity?: string;
  aadharNumber?: string;
  panNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  appInstalled?: boolean;
  firstAppLoginAt?: string | null;
  status: UserStatus;
  kycStatus: string;
  joinedDate: string;
  hasPassword?: boolean;
}
