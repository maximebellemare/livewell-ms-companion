import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
}

const BASE_TITLE = "LiveWithMS";
const DEFAULT_DESCRIPTION =
  "Track your MS symptoms, medications and appointments — all in one place.";

/**
 * Lightweight component that sets <title> and meta description
 * via DOM APIs (no extra dependency needed).
 */
const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    document.title = fullTitle;

    const desc = description ?? DEFAULT_DESCRIPTION;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    } else {
      link?.remove();
    }
  }, [title, description, canonical]);

  return null;
};

export default SEOHead;
