import React from "react";
import styles from "./OAuthButtonGroup.module.css";

interface OAuthButtonGroupProps {
  className?: string;
  disabled?: boolean;
}

/**
 * Standalone recreation: the Floot-brokered Google OAuth flow does not exist
 * outside Floot, so the group renders nothing unless OAuth is explicitly
 * enabled (VITE_ENABLE_OAUTH=true wires your own provider later; see README).
 */
export const OAuthButtonGroup: React.FC<OAuthButtonGroupProps> = ({
  className,
  disabled,
}) => {
  if (import.meta.env.VITE_ENABLE_OAUTH !== "true") return null;
  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Add provider buttons here once a standalone OAuth flow is configured. */}
    </div>
  );
};
