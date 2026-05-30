import {
  Activity, AppWindow, Archive, Award, BarChart3, Bell, Bolt, Bookmark,
  Calendar, Camera, ChartColumn, ChartLine, Check, CheckCircle, Clipboard, Clock, Crown,
  DollarSign, Download, Edit, Eye, FileSpreadsheet, FileText, Folder, Gift, Hash,
  Headphones, ImageIcon, Info, Link, Loader, Mail, Medal, MessageCircle, Package, Phone,
  PieChart, Play, Repeat, Save, ScanLine, Search, Shield, ShieldCheck, Smartphone,
  Sparkles, Star, Store, Target, Trash2, TrendingUp, Upload, User, UserCheck, Users, Wallet,
  XCircle, Zap, Globe, File, Clapperboard
} from 'lucide-react';
import React from 'react';

type IconComponent = React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;

const iconMap: Record<string, IconComponent> = {
  Activity, AppWindow, Archive, Award, BarChart3, Bell, Bolt, Bookmark,
  Calendar, Camera, ChartColumn, ChartLine, Check, CheckCircle, Clipboard, Clock, Crown,
  DollarSign, Download, Edit, Eye, FileSpreadsheet, FileText, Folder, Gift, Hash,
  Headphones, ImageIcon, Info, Link, Loader, Mail, Medal, MessageCircle, Package, Phone,
  PieChart, Play, Repeat, Save, ScanLine, Search, Shield, ShieldCheck, Smartphone,
  Sparkles, Star, Store, Target, Trash2, TrendingUp, Upload, User, UserCheck, Users, Wallet,
  XCircle, Zap, Globe, File, Clapperboard,
};

export function I({ name, size = 20, className, style }: { name?: string; size?: number | string; className?: string; style?: React.CSSProperties }) {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return <span style={{ fontSize: typeof size === 'number' ? size : 20 }}>{name}</span>;
  return <Icon size={typeof size === 'number' ? size : 20} className={className} style={style} />;
}
