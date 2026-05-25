import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  email?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function UserAvatar({ name, src, size = "md", online, className }: UserAvatarProps) {
  return (
    <div className="relative inline-flex">
      <Avatar className={cn(sizeClasses[size], "ring-2 ring-background", className)}>
        {src ? <AvatarImage src={src} alt={name} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      {online ? (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
      ) : null}
    </div>
  );
}
