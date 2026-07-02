"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import "@/app/(presentation-generator)/utils/prism-languages";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { AlertCircle } from "lucide-react";
import { setPresentationData } from "@/store/slices/presentationGeneration";
import { DashboardApi } from "@/app/(presentation-generator)/services/api/dashboard";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";
import { useFontLoader } from "@/app/(presentation-generator)/hooks/useFontLoad";
import { Theme } from "@/app/(presentation-generator)/services/api/types";
import SlideScale from "@/app/(presentation-generator)/components/PresentationRender";
import { normalizeBackendAssetUrls } from "@/utils/api";

const PDF_PRINT_STYLE = `
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  #presentation-slides-wrapper {
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    gap: 0 !important;
  }

  #presentation-slides-wrapper .slides-export-stack {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #presentation-slides-wrapper .main-slide {
    width: 1280px !important;
    min-width: 1280px !important;
    max-width: 1280px !important;
    height: 720px !important;
    min-height: 720px !important;
    max-height: 720px !important;
    flex: 0 0 720px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  #presentation-slides-wrapper .slide-export-inner {
    width: 1280px !important;
    height: 720px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  @media print {
    @page {
      size: 1280px 720px;
      margin: 0;
    }

    #presentation-slides-wrapper {
      overflow: visible !important;
    }

    #presentation-slides-wrapper .main-slide {
      break-after: page;
      page-break-after: always;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #presentation-slides-wrapper .main-slide:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`;

function svgToDataUrl(svg: string): string {
  const encoded =
    typeof window !== "undefined" && typeof window.btoa === "function"
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : "";
  return `data:image/svg+xml;base64,${encoded}`;
}

async function svgToPngDataUrl(
  svg: string,
  width: number,
  height: number,
  filter: string
): Promise<string> {
  const image = new Image();
  image.decoding = "async";
  const svgDataUrl = svgToDataUrl(svg);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("SVG image could not be decoded."));
    image.src = svgDataUrl;
  });

  const scale = Math.max(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return svgDataUrl;
  }

  if (filter && filter !== "none") {
    context.filter = filter;
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function extractCssUrl(backgroundImage: string): string | null {
  const match = backgroundImage.match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] ?? null;
}

function isExportAssetUrl(assetUrl: string): boolean {
  if (assetUrl.startsWith("data:") || typeof window === "undefined") {
    return false;
  }

  try {
    const parsed = new URL(assetUrl, window.location.href);
    return (
      parsed.pathname.startsWith("/app_data/") ||
      parsed.pathname.startsWith("/static/")
    );
  } catch {
    return false;
  }
}

function getSameOriginExportAssetUrl(assetUrl: string): string {
  if (assetUrl.startsWith("data:") || typeof window === "undefined") {
    return assetUrl;
  }

  try {
    const parsed = new URL(assetUrl, window.location.href);
    if (isExportAssetUrl(assetUrl)) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    return assetUrl;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function isExportableBackgroundRect(
  elementRect: DOMRect,
  slideRect: DOMRect
): boolean {
  if (elementRect.width < 24 || elementRect.height < 24) {
    return false;
  }

  const slideArea = slideRect.width * slideRect.height;
  const elementArea = elementRect.width * elementRect.height;
  return elementArea / slideArea >= 0.015;
}

type PresentationPageProps = {
  presentation_id: string;
  exportCookie?: string;
  domToPptxCompat?: boolean;
};

const PresentationPage = ({
  presentation_id,
  exportCookie,
  domToPptxCompat = false,
}: PresentationPageProps) => {
  const pathname = usePathname();
  const [contentLoading, setContentLoading] = useState(true);
  const exportCookieFromHash =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.hash.replace(/^#/, "")).get(
          "exportCookie"
        ) ?? undefined
      : undefined;
  const effectiveExportCookie = exportCookie ?? exportCookieFromHash;

  const dispatch = useDispatch();
  const { presentationData } = useSelector(
    (state: RootState) => state.presentationGeneration
  );
  const [error, setError] = useState(false);
  const slides = presentationData?.slides ?? [];
  const isLoading = contentLoading || slides.length === 0;

  useEffect(() => {
    if (!domToPptxCompat || typeof window === "undefined") return;

    (window as any).__DOM_TO_PPTX_READY__ = false;

    const SVGAnimatedStringCtor = (window as any).SVGAnimatedString;
    const prototype = SVGAnimatedStringCtor?.prototype;
    if (prototype && typeof prototype.split !== "function") {
      Object.defineProperty(prototype, "split", {
        configurable: true,
        value: function split(separator?: string | RegExp, limit?: number) {
          return String(this?.baseVal ?? "").split(separator as any, limit);
        },
      });
    }
  }, [domToPptxCompat]);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    const hideUnsupportedImages = () => {
      document
        .querySelectorAll<HTMLImageElement>(
          "#presentation-slides-wrapper .main-slide img"
        )
        .forEach((image) => {
          const src = image.currentSrc || image.src || image.getAttribute("src") || "";
          if (!/\.(?:emf|wmf)(?:[?#].*)?$/i.test(src)) return;

          image.dataset.exportUnsupportedImage = "1";
          image.remove();
        });
    };

    hideUnsupportedImages();
    const observer = new MutationObserver(hideUnsupportedImages);
    observer.observe(document.getElementById("presentation-slides-wrapper") ?? document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });

    return () => observer.disconnect();
  }, [isLoading, slides]);

  useEffect(() => {
    if (!domToPptxCompat || typeof window === "undefined" || isLoading) return;

    let cancelled = false;
    (window as any).__DOM_TO_PPTX_READY__ = false;

    const waitForExportStyles = async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const tailwindScript = document.querySelector<HTMLScriptElement>(
        'script[src*="tailwindcss.com"]'
      );
      if (!tailwindScript || tailwindScript.dataset.domToPptxReady === "1") {
        return;
      }

      await Promise.race([
        new Promise((resolve) => {
          tailwindScript.addEventListener("load", resolve, { once: true });
          tailwindScript.addEventListener("error", resolve, { once: true });
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      tailwindScript.dataset.domToPptxReady = "1";
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    };

    const hasLargeCssBackgroundImage = () => {
      const slideElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          "#presentation-slides-wrapper .main-slide"
        )
      );

      return slideElements.some((slide) => {
        const slideRect = slide.getBoundingClientRect();
        return Array.from(slide.querySelectorAll<HTMLElement>("*")).some(
          (element) => {
            const style = window.getComputedStyle(element);
            if (!extractCssUrl(style.backgroundImage)) return false;

            const rect = element.getBoundingClientRect();
            return isExportableBackgroundRect(rect, slideRect);
          }
        );
      });
    };

    const waitForCssBackgroundImages = async () => {
      if (!presentationData?.slides?.[0]?.layout?.includes("custom")) {
        return;
      }

      const timeoutAt = Date.now() + 6000;
      while (!cancelled && Date.now() < timeoutAt) {
        if (hasLargeCssBackgroundImage()) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    };

    const inlineCssBackgroundImages = async () => {
      const slideElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          "#presentation-slides-wrapper .main-slide"
        )
      );

      await Promise.all(
        slideElements.flatMap((slide) => {
          const slideRect = slide.getBoundingClientRect();
          return Array.from(slide.querySelectorAll<HTMLElement>("*"))
            .filter((element) => {
              if (element.dataset.domToPptxBackgroundImage === "1") return false;
              if (element.textContent?.trim()) return false;

              const style = window.getComputedStyle(element);
              const imageUrl = extractCssUrl(style.backgroundImage);
              if (!imageUrl) return false;

              const rect = element.getBoundingClientRect();
              return (
                isExportableBackgroundRect(rect, slideRect)
              );
            })
            .map(async (element) => {
              const style = window.getComputedStyle(element);
              const imageUrl = extractCssUrl(style.backgroundImage);
              if (!imageUrl) return;

              try {
                const response = await fetch(getSameOriginExportAssetUrl(imageUrl), {
                  cache: "force-cache",
                });
                if (!response.ok) return;

                const image = document.createElement("img");
                image.src = await blobToDataUrl(await response.blob());
                image.alt = "";
                image.dataset.domToPptxGeneratedBackground = "1";
                image.style.position = "absolute";
                image.style.inset = "0";
                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit =
                  style.backgroundSize === "contain" ? "contain" : "cover";
                image.style.objectPosition = style.backgroundPosition || "50% 50%";
                image.style.pointerEvents = "none";

                element.style.position =
                  style.position === "static" ? "relative" : element.style.position;
                element.style.backgroundImage = "none";
                element.style.overflow = "hidden";
                element.dataset.domToPptxBackgroundImage = "1";
                element.prepend(image);
              } catch (error) {
                console.warn("CSS background image inlining skipped for dom-to-pptx:", imageUrl, error);
              }
            });
        })
      );
    };

    const prepareDomToPptx = async () => {
      await waitForExportStyles();
      if (cancelled) return;

      await waitForCssBackgroundImages();
      if (cancelled) return;

      await inlineCssBackgroundImages();
      if (cancelled) return;

      const slideImages = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          "#presentation-slides-wrapper .main-slide img"
        )
      );

      const rasterImages = slideImages.filter((image) => {
        const src = image.currentSrc || image.src || image.getAttribute("src") || "";
        return (
          Boolean(src) &&
          !src.startsWith("data:") &&
          !src.includes(".svg") &&
          !/\.(?:emf|wmf)(?:[?#].*)?$/i.test(src) &&
          isExportAssetUrl(src)
        );
      });

      await Promise.all(
        rasterImages.map(async (image) => {
          const src = image.currentSrc || image.src || image.getAttribute("src");
          if (!src) return;

          try {
            const response = await fetch(getSameOriginExportAssetUrl(src), {
              cache: "force-cache",
            });
            if (!response.ok) return;

            if (!cancelled) {
              image.src = await blobToDataUrl(await response.blob());
              image.removeAttribute("srcset");
            }
          } catch (error) {
            console.warn("Raster image inlining skipped for dom-to-pptx:", src, error);
          }
        })
      );
      if (cancelled) return;

      const svgImages = slideImages.filter((image) => {
        const src = image.currentSrc || image.src || image.getAttribute("src") || "";
        return src.includes(".svg") && !src.startsWith("data:");
      });

      await Promise.all(
        svgImages.map(async (image) => {
          const src = image.currentSrc || image.src || image.getAttribute("src");
          if (!src) return;

          try {
            const response = await fetch(getSameOriginExportAssetUrl(src), {
              cache: "force-cache",
            });
            if (!response.ok) return;

            const computedStyle = window.getComputedStyle(image);
            const rect = image.getBoundingClientRect();
            const currentColor =
              computedStyle.color && computedStyle.color !== "rgba(0, 0, 0, 0)"
                ? computedStyle.color
                : "#111827";
            const svg = (await response.text())
              .replace(/currentColor/g, currentColor)
              .replace(/currentcolor/g, currentColor);

            if (!cancelled) {
              image.src = await svgToPngDataUrl(
                svg,
                rect.width || image.naturalWidth || 24,
                rect.height || image.naturalHeight || 24,
                computedStyle.filter
              );
              image.removeAttribute("srcset");
            }
          } catch (error) {
            console.warn("SVG image inlining skipped for dom-to-pptx:", src, error);
          }
        })
      );

      if (!cancelled) {
        (window as any).__DOM_TO_PPTX_READY__ = true;
      }
    };

    prepareDomToPptx();

    return () => {
      cancelled = true;
    };
  }, [domToPptxCompat, isLoading, slides]);

  useEffect(() => {
    if (presentationData?.slides?.[0]?.layout?.includes("custom")) {
      const existingScript = document.querySelector(
        'script[src*="tailwindcss.com"]'
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://cdn.tailwindcss.com";
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [presentationData]);
  useEffect(() => {
    fetchUserSlides();
  }, []);

  const fetchUserSlides = async () => {
    try {
      const data = effectiveExportCookie
        ? await fetchPresentationForExport(presentation_id, effectiveExportCookie)
        : await DashboardApi.getPresentation(presentation_id);
      const normalizedData = normalizeBackendAssetUrls(data);
      dispatch(setPresentationData(normalizedData));

      if (normalizedData.fonts) {
        useFontLoader(normalizedData.fonts);
      }
      if (normalizedData?.theme) {
        try {
          applyTheme(normalizedData.theme);
        } catch (themeError) {
          // Theme issues should not block export rendering.
          console.warn("Theme application skipped for pdf-maker:", themeError);
        }
      }
    } catch (error) {
      setError(true);
      notify.error("Failed to load presentation", "The presentation could not be loaded. Please try again.");
      console.error("Error fetching user slides:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchPresentationForExport = async (
    id: string,
    cookieHeader: string
  ) => {
    const response = await fetch(`/api/export-presentation-data/${id}`, {
      method: "GET",
      headers: {
        "x-export-cookie": cookieHeader,
      },
      cache: "no-store",
    });

    return ApiResponseHandler.handleResponse(
      response,
      "Presentation not found"
    );
  };

  const applyTheme = (theme: Theme) => {
    const element = document.getElementById("presentation-slides-wrapper");
    if (!element) return;
    if (!theme?.data) return;
    if (!theme.data.colors["graph_0"]) return;
    if (!theme.data.fonts?.textFont?.name || !theme.data.fonts?.textFont?.url) return;

    const cssVariables = {
      "--primary-color": theme.data.colors["primary"],
      "--background-color": theme.data.colors["background"],
      "--card-color": theme.data.colors["card"],
      "--stroke": theme.data.colors["stroke"],
      "--primary-text": theme.data.colors["primary_text"],
      "--background-text": theme.data.colors["background_text"],
      "--graph-0": theme.data.colors["graph_0"],
      "--graph-1": theme.data.colors["graph_1"],
      "--graph-2": theme.data.colors["graph_2"],
      "--graph-3": theme.data.colors["graph_3"],
      "--graph-4": theme.data.colors["graph_4"],
      "--graph-5": theme.data.colors["graph_5"],
      "--graph-6": theme.data.colors["graph_6"],
      "--graph-7": theme.data.colors["graph_7"],
      "--graph-8": theme.data.colors["graph_8"],
      "--graph-9": theme.data.colors["graph_9"],
    };

    Object.entries(cssVariables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
    const textFontName = theme.data.fonts.textFont.name;
    const textFontUrl = theme.data.fonts.textFont.url;
    useFontLoader({ [textFontName]: textFontUrl });
    element.style.setProperty("font-family", `"${textFontName}"`);
    element.style.setProperty("--heading-font-family", `"${textFontName}"`);
    element.style.setProperty("--body-font-family", `"${textFontName}"`);
  };

  return (
    <div className="m-0 flex flex-col overflow-visible p-0">
      {error ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          <div
            className="bg-white border border-red-300 text-red-700 px-6 py-8 rounded-lg shadow-lg flex flex-col items-center"
            role="alert"
          >
            <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
            <strong className="font-bold text-4xl mb-2">Oops!</strong>
            <p className="block text-2xl py-2">
              We encountered an issue loading your presentation.
            </p>
            <p className="text-lg py-2">
              Please check your internet connection or try again later.
            </p>
            <Button
              className="mt-4 bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300"
              onClick={() => {
                trackEvent(MixpanelEvent.PdfMaker_Retry_Button_Clicked, { pathname });
                window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          <style jsx global>{PDF_PRINT_STYLE}</style>
          <div
            id="presentation-slides-wrapper"
            className="relative m-0 flex w-full flex-col items-center overflow-visible p-0"
          >
            {isLoading ? (
              <div className="relative m-0 flex w-full justify-center p-0">
                <div className="m-0 p-0">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="m-0 h-[720px] w-[1280px] bg-gray-400 p-0"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="slides-export-stack font-inter">
                {slides.map((slide: any, index: number) => (
                  <div
                    key={`${slide.type}-${index}-${slide.index}`}
                    id={`slide-${slide.index}`}
                    className="main-slide relative flex items-center justify-center"
                    data-speaker-note={slide.speaker_note ?? ""}
                  >
                    <div
                      className="slide-export-inner group font-syne"
                      data-layout={slide.layout}
                      data-group={slide.layout_group}
                    >
                      <SlideScale
                        slide={slide}
                        theme={presentationData?.theme ?? null}
                        isEditMode={false}
                        fixedSize
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PresentationPage;
