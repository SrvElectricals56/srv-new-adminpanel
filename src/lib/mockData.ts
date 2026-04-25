import type { Electrician, Dealer, Product, Reward, ScanRecord, Notification, DashboardStats, Offer, PointsConfig, BannerItem } from './types';

export const dashboardStats: DashboardStats = {
  totalElectricians: 1284,
  totalDealers: 87,
  totalScansToday: 342,
  totalPointsAwarded: 485200,
  pendingRedemptions: 23,
  activeUsers: 891,
  revenueThisMonth: 2840000,
  growthRate: 18.4,
};

export const electricians: Electrician[] = [
  { id: 'e1', name: 'Harshvardhan', phone: '9162038214', city: 'Mansa', state: 'Punjab', district: 'Mansa', electricianCode: 'PB03900-001', tier: 'Gold', totalPoints: 2850, totalScans: 142, joinedDate: '2024-01-15', status: 'active', dealerId: 'd1', dealerName: 'Pawan Electricals', bankLinked: true, upiId: 'harsh@upi', recentActivity: '2 hrs ago', walletBalance: 1420, totalRedemptions: 4, subCategory: 'General Electrician' },
  { id: 'e2', name: 'Rohit Kumar', phone: '9876543210', city: 'Bathinda', state: 'Punjab', district: 'Bathinda', electricianCode: 'PB03800-002', tier: 'Silver', totalPoints: 980, totalScans: 56, joinedDate: '2024-02-20', status: 'active', dealerId: 'd1', dealerName: 'Pawan Electricals', bankLinked: true, recentActivity: '1 day ago', walletBalance: 490, totalRedemptions: 1, subCategory: 'Residential Wiring' },
  { id: 'e3', name: 'Aman Sharma', phone: '9810012345', city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', electricianCode: 'PB02200-003', tier: 'Platinum', totalPoints: 5420, totalScans: 271, joinedDate: '2023-11-05', status: 'active', dealerId: 'd2', dealerName: 'Shree Ganesh Electrical', bankLinked: true, upiId: 'aman@paytm', recentActivity: '30 min ago', walletBalance: 2710, totalRedemptions: 8, subCategory: 'Industrial Electrician' },
  { id: 'e4', name: 'Deepak Verma', phone: '9001122334', city: 'Patiala', state: 'Punjab', district: 'Patiala', electricianCode: 'PB03400-004', tier: 'Silver', totalPoints: 640, totalScans: 34, joinedDate: '2024-03-10', status: 'pending', dealerId: 'd2', dealerName: 'Shree Ganesh Electrical', bankLinked: false, recentActivity: '3 days ago', walletBalance: 320, totalRedemptions: 0, subCategory: 'Contractor' },
  { id: 'e5', name: 'Sandeep Gill', phone: '9123456789', city: 'Sangrur', state: 'Punjab', district: 'Sangrur', electricianCode: 'PB03600-005', tier: 'Diamond', totalPoints: 12400, totalScans: 620, joinedDate: '2023-08-01', status: 'active', dealerId: 'd3', dealerName: 'Mahalaxmi Power House', bankLinked: true, upiId: 'sandeep@gpay', recentActivity: '5 min ago', walletBalance: 6200, totalRedemptions: 18, subCategory: 'Panel Board Specialist' },
  { id: 'e6', name: 'Arjun Singh', phone: '9988776655', city: 'Mohali', state: 'Punjab', district: 'SAS Nagar', electricianCode: 'PB02300-006', tier: 'Gold', totalPoints: 3100, totalScans: 158, joinedDate: '2024-01-28', status: 'active', dealerId: 'd1', dealerName: 'Pawan Electricals', bankLinked: true, recentActivity: '4 hrs ago', walletBalance: 1550, totalRedemptions: 5, subCategory: 'Lighting Specialist' },
  { id: 'e7', name: 'Kamaljeet', phone: '9811122233', city: 'Barnala', state: 'Punjab', district: 'Barnala', electricianCode: 'PB03200-007', tier: 'Silver', totalPoints: 520, totalScans: 28, joinedDate: '2024-04-02', status: 'inactive', dealerId: 'd3', dealerName: 'Mahalaxmi Power House', bankLinked: false, recentActivity: '1 week ago', walletBalance: 260, totalRedemptions: 0, subCategory: 'General Electrician' },
  { id: 'e8', name: 'Rakesh Yadav', phone: '9898989898', city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', electricianCode: 'PB02200-008', tier: 'Platinum', totalPoints: 4800, totalScans: 240, joinedDate: '2023-10-12', status: 'active', dealerId: 'd2', dealerName: 'Shree Ganesh Electrical', bankLinked: true, upiId: 'rakesh@phonepe', recentActivity: '2 hrs ago', walletBalance: 2400, totalRedemptions: 7, subCategory: 'Solar Installer' },
  { id: 'e9', name: 'Gurpreet Singh', phone: '9717171717', city: 'Amritsar', state: 'Punjab', district: 'Amritsar', electricianCode: 'PB01800-009', tier: 'Gold', totalPoints: 2200, totalScans: 112, joinedDate: '2024-02-14', status: 'active', dealerId: 'd4', dealerName: 'Shiv Shakti Distributors', bankLinked: true, recentActivity: '1 hr ago', walletBalance: 1100, totalRedemptions: 3, subCategory: 'AC/Appliance Technician' },
  { id: 'e10', name: 'Manjit Kaur', phone: '9606060606', city: 'Jalandhar', state: 'Punjab', district: 'Jalandhar', electricianCode: 'PB02100-010', tier: 'Silver', totalPoints: 780, totalScans: 42, joinedDate: '2024-03-25', status: 'active', dealerId: 'd4', dealerName: 'Shiv Shakti Distributors', bankLinked: false, recentActivity: '6 hrs ago', walletBalance: 390, totalRedemptions: 1, subCategory: 'Residential Wiring' },
  { id: 'e11', name: 'Vikram Bhatia', phone: '9898001122', city: 'Panchkula', state: 'Haryana', district: 'Panchkula', electricianCode: 'HR02000-011', tier: 'Gold', totalPoints: 3400, totalScans: 170, joinedDate: '2023-12-01', status: 'active', dealerId: 'd5', dealerName: 'Krishna Electricals', bankLinked: true, upiId: 'vikram@upi', recentActivity: '3 hrs ago', walletBalance: 1700, totalRedemptions: 6, subCategory: 'Industrial Electrician' },
  { id: 'e12', name: 'Priya Patel', phone: '9000000012', city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', electricianCode: 'GJ01000-012', tier: 'Silver', totalPoints: 890, totalScans: 48, joinedDate: '2024-04-10', status: 'pending', dealerId: 'd5', dealerName: 'Krishna Electricals', bankLinked: false, recentActivity: '2 days ago', walletBalance: 445, totalRedemptions: 0, subCategory: 'Contractor' },
];

export const dealers: Dealer[] = [
  { id: 'd1', name: 'Pawan Electricals', phone: '9876543210', email: 'pawan@example.com', dealerCode: 'PB-05-800206-001', town: 'Mansa', district: 'Mansa', state: 'Punjab', address: 'Shop No. 18, Power Market, Near Bus Stand, Mansa, Punjab 151505', pincode: '151505', tier: 'Platinum', electricianCount: 324, status: 'active', joinedDate: '2023-06-01', gstNumber: 'BIBPB7675A', bankLinked: true, upiId: 'pawan@gpay', totalOrders: 1240, monthlyTarget: 500000, achievedTarget: 420000, contactPerson: 'Pawan Bansal' },
  { id: 'd2', name: 'Shree Ganesh Electrical Traders', phone: '9810012345', email: 'ganesh@example.com', dealerCode: 'RJ-01-900101-002', town: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', address: 'Shop 4, Electrical Market, MI Road, Jaipur', pincode: '302001', tier: 'Gold', electricianCount: 187, status: 'active', joinedDate: '2023-08-15', gstNumber: 'GSTR12345J', bankLinked: true, totalOrders: 760, monthlyTarget: 300000, achievedTarget: 280000, contactPerson: 'Ganesh Gupta' },
  { id: 'd3', name: 'Mahalaxmi Power House', phone: '9810099887', email: 'mahalaxmi@example.com', dealerCode: 'DL-01-110001-003', town: 'Delhi', district: 'Central Delhi', state: 'Delhi', address: 'Block 5, Bhagirath Place, Chandni Chowk, Delhi', pincode: '110006', tier: 'Diamond', electricianCount: 512, status: 'active', joinedDate: '2023-04-10', gstNumber: 'DELPWR8899D', bankLinked: true, upiId: 'mahalaxmi@paytm', totalOrders: 2100, monthlyTarget: 800000, achievedTarget: 850000, contactPerson: 'Suresh Agarwal' },
  { id: 'd4', name: 'Shiv Shakti Distributors', phone: '9001122334', dealerCode: 'UP-16-226001-004', town: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', address: 'Aminabad Market, Lucknow', pincode: '226001', tier: 'Silver', electricianCount: 98, status: 'active', joinedDate: '2024-01-05', gstNumber: 'UPSHK5567S', bankLinked: true, totalOrders: 340, monthlyTarget: 200000, achievedTarget: 180000, contactPerson: 'Shiv Gupta' },
  { id: 'd5', name: 'Krishna Electricals', phone: '9771234567', email: 'krishna@example.com', dealerCode: 'GJ-07-380001-005', town: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', address: 'Ring Road, Odhav Industrial Area, Ahmedabad', pincode: '382415', tier: 'Gold', electricianCount: 143, status: 'pending', joinedDate: '2024-02-28', gstNumber: 'GJKRI4432K', bankLinked: false, totalOrders: 520, monthlyTarget: 300000, achievedTarget: 220000, contactPerson: 'Krishna Patel' },
  { id: 'd6', name: 'Bharat Power Solutions', phone: '9555444333', email: 'bharat@example.com', dealerCode: 'MH-14-411001-006', town: 'Pune', district: 'Pune', state: 'Maharashtra', address: 'Shop 22, Shivaji Market, Pune', pincode: '411001', tier: 'Silver', electricianCount: 67, status: 'active', joinedDate: '2024-03-15', gstNumber: 'MHBHP3321P', bankLinked: true, totalOrders: 180, monthlyTarget: 150000, achievedTarget: 140000, contactPerson: 'Bharat Joshi' },
];

export const products: Product[] = [
  { id: 'p1', name: 'FAN BOX 3" RANGE', sub: 'F8/FC/FDB 18/40 PC', category: 'Fan Box', subCategory: 'Standard', image: 'https://srvelectricals.com/cdn/shop/files/F8_3_18-40.png?v=1757426631&width=240', points: 10, badge: 'Popular', price: '₹89', mrp: '₹99', stock: 4200, totalScanned: 12840, sku: 'SRV-FB-3-001', weight: '180g', description: 'Standard 3-inch fan box for residential wiring.', isActive: true },
  { id: 'p2', name: 'FAN BOX 4" RANGE', sub: 'FC 4 17/30, 20/40 PC', category: 'Fan Box', subCategory: 'Heavy Duty', image: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=240', points: 12, badge: '', price: '₹104', mrp: '₹120', stock: 3100, totalScanned: 9420, sku: 'SRV-FB-4-002', isActive: true },
  { id: 'p3', name: 'CONCEALED BOX 3"', sub: 'CRD PL 3 precision engineered', category: 'Concealed Box', subCategory: 'Precision', image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=240', points: 15, badge: 'Best Seller', price: '₹120', mrp: '₹135', stock: 2800, totalScanned: 18600, sku: 'SRV-CB-3-003', isActive: true },
  { id: 'p4', name: 'MODULE BOX PLATINUM', sub: 'Premium modular range 3x3', category: 'Modular Box', subCategory: 'Platinum Range', image: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=240', points: 25, badge: 'Premium', price: '₹350', mrp: '₹399', stock: 1600, totalScanned: 6200, sku: 'SRV-MB-PT-004', isActive: true },
  { id: 'p5', name: 'HEAT BLOWER O2', sub: 'Home heater blower O2 series', category: 'Appliances', subCategory: 'Heaters', image: 'https://srvelectricals.com/cdn/shop/files/Home-Heater-O2-Blower.png?v=1741846484&width=240', points: 50, badge: 'Hot', price: '₹1299', mrp: '₹1499', stock: 820, totalScanned: 3400, sku: 'SRV-APP-HB-005', isActive: true },
  { id: 'p6', name: 'JUNCTION BOX CNG', sub: 'CNG type multi-purpose junction', category: 'Junction Box', image: 'https://srvelectricals.com/cdn/shop/files/Junction_Box_CNG.png?v=1757426491&width=240', points: 12, badge: '', price: '₹95', stock: 5400, totalScanned: 7800, sku: 'SRV-JB-CNG-006', isActive: true },
  { id: 'p7', name: '2-PIN PLUG GIRISH', sub: 'Premium quality 2-pin plug', category: 'Accessories', image: 'https://srvelectricals.com/cdn/shop/files/2-Pin-Girish.png?v=1756461334&width=240', points: 5, badge: 'New', price: '₹45', mrp: '₹55', stock: 8200, totalScanned: 5100, sku: 'SRV-ACC-2P-007', isActive: true },
  { id: 'p8', name: 'LED FLOOD LIGHT SLEEK', sub: 'Outdoor high-throw beam lighting', category: 'LED Lights', image: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=240', points: 30, badge: '', price: '₹699', mrp: '₹799', stock: 940, totalScanned: 2800, sku: 'SRV-LED-FL-008', isActive: true },
  { id: 'p9', name: 'MCB BOX GI 4 WAY', sub: 'Reliable DB box for sites', category: 'MCB Box', image: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=240', points: 40, badge: 'Industrial', price: '₹830', mrp: '₹950', stock: 620, totalScanned: 1900, sku: 'SRV-MCB-4W-009', isActive: true },
  { id: 'p10', name: 'SURFACE BOX 1M', sub: 'Single module surface mount', category: 'Surface Box', image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=240', points: 8, badge: '', price: '₹65', stock: 6100, totalScanned: 8400, sku: 'SRV-SB-1M-010', isActive: false },
];

export const redemptions: Reward[] = [
  { id: 'r1', userId: 'e5', userName: 'Sandeep Gill', role: 'electrician', type: 'Rs 100 Cashback', points: 500, status: 'pending', requestedAt: '2024-04-18T08:30:00', upiId: 'sandeep@gpay', amount: 100 },
  { id: 'r2', userId: 'e3', userName: 'Aman Sharma', role: 'electrician', type: 'Amazon Voucher', points: 1000, status: 'approved', requestedAt: '2024-04-17T14:20:00', processedAt: '2024-04-18T09:00:00', amount: 200 },
  { id: 'r3', userId: 'e1', userName: 'Harshvardhan', role: 'electrician', type: 'SRV Product Bundle', points: 2000, status: 'pending', requestedAt: '2024-04-18T07:10:00', amount: 500 },
  { id: 'r4', userId: 'e8', userName: 'Rakesh Yadav', role: 'electrician', type: 'Paytm Voucher', points: 750, status: 'approved', requestedAt: '2024-04-16T11:00:00', processedAt: '2024-04-17T10:30:00', upiId: 'rakesh@phonepe', amount: 150 },
  { id: 'r5', userId: 'e6', userName: 'Arjun Singh', role: 'electrician', type: 'Rs 100 Cashback', points: 500, status: 'rejected', requestedAt: '2024-04-15T09:45:00', processedAt: '2024-04-16T08:00:00', amount: 100 },
  { id: 'r6', userId: 'e9', userName: 'Gurpreet Singh', role: 'electrician', type: 'Amazon Voucher', points: 1000, status: 'pending', requestedAt: '2024-04-18T06:00:00', amount: 200 },
  { id: 'r7', userId: 'e11', userName: 'Vikram Bhatia', role: 'electrician', type: 'Rs 500 Bank Transfer', points: 2500, status: 'pending', requestedAt: '2024-04-18T11:00:00', bankAccount: '****5678', amount: 500 },
];

export const recentScans: ScanRecord[] = [
  { id: 's1', userId: 'e5', userName: 'Sandeep Gill', role: 'electrician', productName: 'FAN BOX 3" RANGE', productId: 'p1', points: 10, mode: 'multi', scannedAt: '2024-04-18T10:15:00', location: 'Sangrur, Punjab' },
  { id: 's2', userId: 'e3', userName: 'Aman Sharma', role: 'electrician', productName: 'CONCEALED BOX 3"', productId: 'p3', points: 15, mode: 'single', scannedAt: '2024-04-18T09:50:00', location: 'Ludhiana, Punjab' },
  { id: 's3', userId: 'e1', userName: 'Harshvardhan', role: 'electrician', productName: 'LED FLOOD LIGHT SLEEK', productId: 'p8', points: 30, mode: 'single', scannedAt: '2024-04-18T09:30:00', location: 'Mansa, Punjab' },
  { id: 's4', userId: 'e9', userName: 'Gurpreet Singh', role: 'electrician', productName: 'MODULE BOX PLATINUM', productId: 'p4', points: 25, mode: 'multi', scannedAt: '2024-04-18T09:10:00', location: 'Amritsar, Punjab' },
  { id: 's5', userId: 'e2', userName: 'Rohit Kumar', role: 'electrician', productName: 'FAN BOX 4" RANGE', productId: 'p2', points: 12, mode: 'single', scannedAt: '2024-04-18T08:45:00', location: 'Bathinda, Punjab' },
  { id: 's6', userId: 'e6', userName: 'Arjun Singh', role: 'electrician', productName: 'MCB BOX GI 4 WAY', productId: 'p9', points: 40, mode: 'multi', scannedAt: '2024-04-18T08:20:00', location: 'Mohali, Punjab' },
  { id: 's7', userId: 'e8', userName: 'Rakesh Yadav', role: 'electrician', productName: 'HEAT BLOWER O2', productId: 'p5', points: 50, mode: 'single', scannedAt: '2024-04-18T07:55:00', location: 'Ludhiana, Punjab' },
  { id: 's8', userId: 'e11', userName: 'Vikram Bhatia', role: 'electrician', productName: 'JUNCTION BOX CNG', productId: 'p6', points: 12, mode: 'multi', scannedAt: '2024-04-18T07:30:00', location: 'Panchkula, Haryana' },
];

export const notifications: Notification[] = [
  { id: 'n1', title: 'Double Points Weekend!', message: 'Scan any SRV product this weekend to earn 2x points. Offer valid Saturday-Sunday only.', targetRole: 'electrician', sentAt: '2024-04-17T10:00:00', status: 'sent', openRate: 78 },
  { id: 'n2', title: 'New Dealer Tier Benefits', message: 'Platinum dealers now get exclusive access to new product launches 48 hours early.', targetRole: 'dealer', sentAt: '2024-04-16T14:30:00', status: 'sent', openRate: 65 },
  { id: 'n3', title: 'App Update Available', message: 'New version with improved scanning speed and wallet features now available.', targetRole: 'all', sentAt: '2024-04-15T09:00:00', status: 'sent', openRate: 82 },
  { id: 'n4', title: 'Seasonal Offer Alert', message: 'Summer sale products now eligible for bonus 5 points each.', targetRole: 'electrician', sentAt: '2024-04-20T10:00:00', status: 'scheduled' },
  { id: 'n5', title: 'Bank Linking Reminder', message: 'Link your bank account to start instant cashback redemptions.', targetRole: 'electrician', sentAt: '2024-04-14T08:00:00', status: 'sent', openRate: 54 },
];

export const offers: Offer[] = [
  { id: 'o1', title: 'Double Points Weekend', description: 'Earn 2x points on all fan box products this weekend', discount: '2x Points', validFrom: '2024-04-20', validTo: '2024-04-21', targetRole: 'electrician', status: 'scheduled', productCategory: 'Fan Box', bonusPoints: 20 },
  { id: 'o2', title: 'Festive Season Bonus', description: '5 bonus points on every product scan during Diwali season', discount: '+5 Bonus Points', validFrom: '2024-04-01', validTo: '2024-04-30', targetRole: 'all', status: 'active', bonusPoints: 5 },
  { id: 'o3', title: 'Dealer Loyalty Reward', description: 'Exclusive 10% off on next order for Diamond dealers', discount: '10% OFF', validFrom: '2024-03-01', validTo: '2024-03-31', targetRole: 'dealer', status: 'expired' },
  { id: 'o4', title: 'LED Lights Promo', description: 'Extra 15 points for every LED product scanned', discount: '+15 Points', validFrom: '2024-05-01', validTo: '2024-05-31', targetRole: 'electrician', status: 'scheduled', productCategory: 'LED Lights', bonusPoints: 15 },
];

export const pointsConfig: PointsConfig[] = [
  { id: 'pc1', productId: 'p1', productName: 'FAN BOX 3" RANGE', basePoints: 10, bonusPoints: 0, isActive: true, updatedAt: '2024-04-01' },
  { id: 'pc2', productId: 'p2', productName: 'FAN BOX 4" RANGE', basePoints: 12, bonusPoints: 0, isActive: true, updatedAt: '2024-04-01' },
  { id: 'pc3', productId: 'p3', productName: 'CONCEALED BOX 3"', basePoints: 15, bonusPoints: 5, isActive: true, updatedAt: '2024-04-10' },
  { id: 'pc4', productId: 'p4', productName: 'MODULE BOX PLATINUM', basePoints: 25, bonusPoints: 0, isActive: true, updatedAt: '2024-04-01' },
  { id: 'pc5', productId: 'p5', productName: 'HEAT BLOWER O2', basePoints: 50, bonusPoints: 10, isActive: true, updatedAt: '2024-04-15' },
  { id: 'pc6', productId: 'p8', productName: 'LED FLOOD LIGHT SLEEK', basePoints: 30, bonusPoints: 0, isActive: true, updatedAt: '2024-04-01' },
];

export const banners: BannerItem[] = [
  { id: 'b1', title: 'ACO Product Range', imageUrl: 'https://srvelectricals.com/cdn/shop/files/F8_3_18-40.png?v=1757426631&width=600', targetRole: 'all', status: 'active', order: 1, createdAt: '2024-04-01' },
  { id: 'b2', title: 'Summer Appliances', imageUrl: 'https://srvelectricals.com/cdn/shop/files/Home-Heater-O2-Blower.png?v=1741846484&width=600', targetRole: 'electrician', status: 'active', order: 2, createdAt: '2024-04-05' },
  { id: 'b3', title: 'Dealer Special Offer', imageUrl: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=600', targetRole: 'dealer', status: 'inactive', order: 3, createdAt: '2024-04-10' },
];

export const scanChartData = [
  { day: 'Mon', electrician: 180, dealer: 45 },
  { day: 'Tue', electrician: 220, dealer: 52 },
  { day: 'Wed', electrician: 195, dealer: 38 },
  { day: 'Thu', electrician: 280, dealer: 61 },
  { day: 'Fri', electrician: 310, dealer: 74 },
  { day: 'Sat', electrician: 380, dealer: 88 },
  { day: 'Sun', electrician: 342, dealer: 67 },
];

export const tierDistribution = [
  { tier: 'Silver', count: 620, color: '#94A3B8' },
  { tier: 'Gold', count: 410, color: '#F59E0B' },
  { tier: 'Platinum', count: 198, color: '#6B7280' },
  { tier: 'Diamond', count: 56, color: '#3B82F6' },
];

export const pointsChartData = [
  { month: 'Nov', points: 38000 },
  { month: 'Dec', points: 52000 },
  { month: 'Jan', points: 48000 },
  { month: 'Feb', points: 61000 },
  { month: 'Mar', points: 74000 },
  { month: 'Apr', points: 85200 },
];
