// Handles /affiliate/ref/:code — captures the click, redirects to /ghost
// This keeps ref capture logic out of GhostLandingPage entirely.
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { captureRef } from "../affiliateStorage";

export default function AffiliateRefPage() {
  const { code } = useParams<{ code: string }>();
  const navigate  = useNavigate();

  useEffect(() => {
    if (code) captureRef(code);
    navigate("/ghost", { replace: true });
  }, [code, navigate]);

  return null;
}
