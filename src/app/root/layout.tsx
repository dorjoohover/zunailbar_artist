import { ReactNode } from "react";
import Template from "./template";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <Template>{children}</Template>;
}
