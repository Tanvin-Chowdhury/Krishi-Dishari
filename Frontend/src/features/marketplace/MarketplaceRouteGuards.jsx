import { Navigate } from 'react-router';
import { useContext } from 'react';
import { AuthContext } from '../../core/auth/AuthContext';

/** Farmer, wholeseller, consultant, labour — fixed-price purchase */
const BUYER_ROLES = [1, 2, 3, 4];

/** Farmer, wholeseller, consultant — list/sell farming products */
const SELLER_ROLES = [1, 2, 3];

export function MarketplaceBuyerOnly({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role_id === 6) return <Navigate to="/app/market" replace />;
  if (!BUYER_ROLES.includes(user.role_id)) {
    return <Navigate to="/app/home" replace />;
  }
  return children;
}

export function MarketplaceSellerOnly({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role_id === 6) {
    return <Navigate to="/app/admin/marketplace" replace />;
  }
  if (!SELLER_ROLES.includes(user.role_id)) {
    return <Navigate to="/app/market" replace />;
  }
  return children;
}

/** @deprecated use MarketplaceBuyerOnly or MarketplaceSellerOnly */
export function MarketplaceTraderOnly({ children }) {
  return <MarketplaceBuyerOnly>{children}</MarketplaceBuyerOnly>;
}

export function canBuyMarketplace(user) {
  return user && BUYER_ROLES.includes(user.role_id);
}

export function canSellMarketplace(user) {
  return user && SELLER_ROLES.includes(user.role_id);
}

/** @deprecated use canBuyMarketplace */
export function canTradeMarketplace(user) {
  return canBuyMarketplace(user);
}
