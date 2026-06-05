import { useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "../../Provider/AuthContext";

/** Only farmers (role_id 1) may access wrapped routes. */
export function FarmerOnly({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role_id !== 1) return <Navigate to="/app/auctions" replace />;
  return children;
}

/** Farmers (1) and wholesalers (2) may bid; other roles cannot access bidder-only routes. */
export function BidderOnly({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/auth/login" replace />;
  const canBidRole = user.role_id === 1 || user.role_id === 2;
  if (!canBidRole) return <Navigate to="/app/auctions" replace />;
  return children;
}

/** True when user is allowed to place bids (not the same as "can bid on this auction"). */
export function isBidderRole(roleId) {
  return roleId === 1 || roleId === 2;
}

export default FarmerOnly;
