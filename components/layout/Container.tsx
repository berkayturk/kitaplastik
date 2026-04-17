import { cn } from "@/lib/utils";
import type { HTMLAttributes, ElementType, ComponentType, PropsWithChildren } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function Container<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  // Cast through ComponentType to sidestep JSX IntrinsicElements pollution
  // from @react-three/fiber's global augmentation, which collapses the
  // children type of polymorphic `ElementType` renders to `never`.
  const Component = (as ?? "div") as unknown as ComponentType<
    PropsWithChildren<HTMLAttributes<HTMLElement>>
  >;
  return (
    <Component className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...rest}>
      {children}
    </Component>
  );
}
