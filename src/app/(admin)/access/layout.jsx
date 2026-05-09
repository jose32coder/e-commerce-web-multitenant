import { PLATFORM_BRAND_NAME } from "@/lib/siteConfig";

export const metadata = {
  title: {
    absolute: `Acceso Admin | ${PLATFORM_BRAND_NAME}`,
  },
};

export default function AccessLayout({ children }) {
  return children;
}
