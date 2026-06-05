export const TYPE_META = {
  NEW_BID: { icon: '⚖️', label: 'নতুন বিড' },
  OUTBID: { icon: '📉', label: 'বিড ছাড়িয়ে গেছে' },
  AUCTION_WON: { icon: '🏆', label: 'নিলাম জয়' },
  AUCTION_LOST: { icon: '😔', label: 'নিলাম হার' },
  AUCTION_CLOSED: { icon: '🔒', label: 'নিলাম শেষ' },
  AUCTION_CANCELLED: { icon: '❌', label: 'নিলাম বাতিল' },
  NEW_AUCTION: { icon: '🆕', label: 'নতুন নিলাম' },
  NEW_MESSAGE: { icon: '💬', label: 'বার্তা' },
  NEW_ORDER: { icon: '🛒', label: 'নতুন অর্ডার' },
  ORDER_UPDATED: { icon: '📦', label: 'অর্ডার আপডেট' },
  SYSTEM_ALERT: { icon: '🔔', label: 'সিস্টেম' },
  LOAN_SUBMITTED: { icon: '💳', label: 'ঋণ আবেদন' },
  LOAN_UNDER_REVIEW: { icon: '🔍', label: 'ঋণ পর্যালোচনাধীন' },
  LOAN_APPROVED: { icon: '✅', label: 'ঋণ অনুমোদন' },
  LOAN_REJECTED: { icon: '⛔', label: 'ঋণ প্রত্যাখ্যাত' },
  LOAN_INSTALLMENT_DUE: { icon: '📅', label: 'কিস্তি নিকট' },
  LOAN_INSTALLMENT_OVERDUE: { icon: '⚠️', label: 'কিস্তি বকেয়া' },
  LOAN_PAYMENT_SUCCESS: { icon: '✓', label: 'কিস্তি পরিশোধ' },
  LABOR_REQUEST_NEW: { icon: '👷', label: 'নতুন শ্রম অনুরোধ' },
  LABOR_REQUEST_ACCEPTED: { icon: '✅', label: 'শ্রম গৃহীত' },
  LABOR_REQUEST_REJECTED: { icon: '❌', label: 'শ্রম প্রত্যাখ্যাত' },
  LABOR_REQUEST_CANCELLED: { icon: '🚫', label: 'শ্রম বাতিল' },
  LABOR_JOB_COMPLETED: { icon: '🎉', label: 'কাজ সম্পন্ন' },
  WAREHOUSE_BOOKING_SUBMITTED: { icon: '🏭', label: 'গুদাম বুকিং' },
  WAREHOUSE_BOOKING_NEW: { icon: '📥', label: 'নতুন বুকিং' },
  WAREHOUSE_BOOKING_APPROVED: { icon: '✅', label: 'বুকিং অনুমোদিত' },
  WAREHOUSE_BOOKING_REJECTED: { icon: '⛔', label: 'বুকিং প্রত্যাখ্যাত' },
  WAREHOUSE_BOOKING_STARTED: { icon: '▶️', label: 'বুকিং শুরু' },
  WAREHOUSE_BOOKING_COMPLETED: { icon: '✓', label: 'বুকিং সম্পন্ন' },
  bid_update: { icon: '⚖️', label: 'নতুন বিড' },
  outbid: { icon: '📉', label: 'বিড ছাড়িয়ে গেছে' },
  auction_won: { icon: '🏆', label: 'নিলাম জয়' },
  auction_ended: { icon: '🔒', label: 'নিলাম শেষ' },
  chat_message: { icon: '💬', label: 'বার্তা' },
  order_update: { icon: '📦', label: 'অর্ডার' },
  system: { icon: '🔔', label: 'সিস্টেম' },
  COMMUNITY_COMMENT: { icon: '👥', label: 'কমিউনিটি মন্তব্য' },
  COMMUNITY_REPLY: { icon: '↩️', label: 'কমিউনিটি উত্তর' },
  EDUCATION_CERTIFICATE: { icon: '🎓', label: 'সনদপত্র' },
  WEATHER_HEAVY_RAIN: { icon: '🌧️', label: 'ভারী বৃষ্টি' },
  WEATHER_HIGH_TEMP: { icon: '🌡️', label: 'উচ্চ তাপ' },
  WEATHER_HIGH_HUMIDITY: { icon: '💧', label: 'উচ্চ আর্দ্রতা' },
  WEATHER_HIGH_WIND: { icon: '💨', label: 'প্রবল বাতাস' },
  NEWS_PUBLISHED: { icon: '📰', label: 'নতুন সংবাদ' },
  NEWS_BREAKING: { icon: '🚨', label: 'ব্রেকিং সংবাদ' },
  NEWS_DISEASE_ALERT: { icon: '🦠', label: 'রোগ সতর্কতা' },
  NEWS_WEATHER_ALERT: { icon: '🌧️', label: 'আবহাওয়া সংবাদ' },
  NEWS_GOVERNMENT: { icon: '🏛️', label: 'সরকারি বিজ্ঞপ্তি' },
  NEWS_ARTICLE_APPROVED: { icon: '✅', label: 'নিবন্ধ অনুমোদিত' },
  NEWS_ARTICLE_REJECTED: { icon: '❌', label: 'নিবন্ধ প্রত্যাখ্যাত' },
  NEWS_ARTICLE_PENDING_REVIEW: { icon: '📝', label: 'নিবন্ধ পর্যালোচনা' },
  weather_alert: { icon: '🌧️', label: 'আবহাওয়া সতর্কতা' },
};

export function getNotificationLink(n) {
  const ref = n.reference_id;
  const type = n.type;
  const refType = n.reference_type;

  if (
    refType === 'auction' ||
    ['NEW_BID', 'OUTBID', 'AUCTION_WON', 'AUCTION_LOST', 'AUCTION_CLOSED', 'AUCTION_CANCELLED', 'NEW_AUCTION', 'bid_update', 'outbid', 'auction_won', 'auction_ended'].includes(type)
  ) {
    return ref ? `/app/auctions/${ref}` : '/app/auctions';
  }
  if (refType === 'conversation' || type === 'NEW_MESSAGE' || type === 'chat_message') {
    return ref ? `/app/chat?conversationId=${ref}` : '/app/chat';
  }
  if (refType === 'order' || type === 'NEW_ORDER' || type === 'ORDER_UPDATED' || type === 'order_update') {
    return ref ? `/app/market/orders/${ref}` : '/app/market/orders';
  }
  if (
    refType === 'labor' ||
    [
      'LABOR_REQUEST_NEW',
      'LABOR_REQUEST_ACCEPTED',
      'LABOR_REQUEST_REJECTED',
      'LABOR_REQUEST_CANCELLED',
      'LABOR_JOB_COMPLETED',
    ].includes(type)
  ) {
    if (type === 'LABOR_REQUEST_NEW') return '/app/my-labor';
    return '/app/labor/requests';
  }
  if (
    refType === 'warehouse' ||
    [
      'WAREHOUSE_BOOKING_SUBMITTED',
      'WAREHOUSE_BOOKING_NEW',
      'WAREHOUSE_BOOKING_APPROVED',
      'WAREHOUSE_BOOKING_REJECTED',
      'WAREHOUSE_BOOKING_STARTED',
      'WAREHOUSE_BOOKING_COMPLETED',
    ].includes(type)
  ) {
    if (type === 'WAREHOUSE_BOOKING_NEW') return '/app/admin/warehouses';
    return '/app/warehouse/bookings';
  }
  if (
    refType === 'loan' ||
    [
      'LOAN_SUBMITTED',
      'LOAN_UNDER_REVIEW',
      'LOAN_APPROVED',
      'LOAN_REJECTED',
      'LOAN_INSTALLMENT_DUE',
      'LOAN_INSTALLMENT_OVERDUE',
      'LOAN_PAYMENT_SUCCESS',
    ].includes(type)
  ) {
    return '/app/loan';
  }
  if (
    refType === 'community' ||
    type === 'COMMUNITY_COMMENT' ||
    type === 'COMMUNITY_REPLY'
  ) {
    return ref ? `/app/community/${ref}` : '/app/community';
  }
  if (refType === 'education' || type === 'EDUCATION_CERTIFICATE') {
    return '/app/education/certificates';
  }
  if (
    refType === 'news' ||
    [
      'NEWS_PUBLISHED',
      'NEWS_BREAKING',
      'NEWS_DISEASE_ALERT',
      'NEWS_WEATHER_ALERT',
      'NEWS_GOVERNMENT',
      'NEWS_ARTICLE_APPROVED',
      'NEWS_ARTICLE_REJECTED',
    ].includes(type)
  ) {
    return '/app/news';
  }
  if (type === 'NEWS_ARTICLE_PENDING_REVIEW') {
    return '/app/admin/news?status=pending_review';
  }
  if (
    [
      'WEATHER_HEAVY_RAIN',
      'WEATHER_HIGH_TEMP',
      'WEATHER_HIGH_HUMIDITY',
      'WEATHER_HIGH_WIND',
      'weather_alert',
    ].includes(type)
  ) {
    return '/app/weather';
  }
  return '/app/notifications';
}

export function fmtNotifTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'এখন';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}মি আগে`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
}

export const CATEGORIES = [
  { id: '', label: 'সব' },
  { id: 'auction', label: 'নিলাম' },
  { id: 'messages', label: 'বার্তা' },
  { id: 'marketplace', label: 'মার্কেট' },
  { id: 'loan', label: 'ঋণ' },
  { id: 'labor', label: 'শ্রম' },
  { id: 'warehouse', label: 'গুদাম' },
  { id: 'system', label: 'সিস্টেম' },
];
