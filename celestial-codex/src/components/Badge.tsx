import styles from "./Badge.module.css";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "primary"
    | "destructive"
    | "outline"
    | "secondary"
    | "success"
    | "warning";
}

export const Badge = ({
  variant = "primary",
  className,
  children,
  ...props
}: Props) => {
  return (
    <div
      className={`${styles.badge} ${styles[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

