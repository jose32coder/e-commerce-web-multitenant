import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollStop";
import SiteConfigGate from "@/components/SiteConfigGate";
import { TenantHeroMetricsProvider } from "@/context/TenantHeroMetricsContext";
import TenantBrandingLayout from "@/components/tenant/TenantBrandingLayout";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { OrderTrackingProvider } from "@/components/public/checkout/OrderTrackingProvider";
import StoreOnboarding from "@/components/public/onboarding/StoreOnboarding";
import {
  PLATFORM_BRAND_HOSTNAME,
  DEFAULT_SITE_NAME,
  formatSiteHostname,
} from "@/lib/siteConfig";
import { getSiteConfigServerCached } from "@/lib/siteConfig.server";

export async function generateMetadata({ params }) {
  const { tenant } = await params;
  const { site_name } = await getSiteConfigServerCached({ tenantSlug: tenant });

  const brand = site_name || DEFAULT_SITE_NAME;
  const baseHost = PLATFORM_BRAND_HOSTNAME.replace(/^https?:\/\//, "");
  const hostname = formatSiteHostname(brand) || baseHost;
  const url = `https://${hostname}/${tenant}`;

  return {
    title: {
      default: `${brand}`,
      template: `%s | ${brand}`,
    },
    description: "Piezas esenciales con estética atemporal.",
    openGraph: {
      type: "website",
      locale: "es_ES",
      url,
      siteName: brand,
    },
  };
}

export default async function TenantLayout({ children, params }) {
  const { tenant } = await params;

  return (
    <TenantBrandingLayout tenant={tenant}>
      <SiteConfigProvider tenantSlug={tenant}>
        <SiteConfigGate>
          <OrderTrackingProvider>
            <TenantHeroMetricsProvider>
              <StoreOnboarding />
              <div 
                className="flex flex-col min-h-screen overflow-x-hidden"
                id="tenant-root-container"
              >
                <ScrollToTop />
                <Header />
                <main className="grow bg-white pt-16">{children}</main>
                <Footer />
              </div>
            </TenantHeroMetricsProvider>
          </OrderTrackingProvider>
        </SiteConfigGate>
      </SiteConfigProvider>
    </TenantBrandingLayout>
  );
}
