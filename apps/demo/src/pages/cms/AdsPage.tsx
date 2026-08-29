import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { AdsList } from "@/pages/cms/ads/AdsList";
import { adsSearch } from "@/pages/cms/ads/search";

const defaultDetailId = "roofing-replacement-spring";

type AdsConnect = {
  googleConnected: boolean;
  metaConnected: boolean;
  onConnectGoogle: () => void;
  onConnectMeta: () => void;
};

const AdsConnectContext = createContext<AdsConnect | null>(null);

function useAdsConnect(): AdsConnect {
  const value = useContext(AdsConnectContext);
  if (!value) {
    throw new Error("useAdsConnect must be used inside AdsPage");
  }
  return value;
}

export function AdsPage(): ReactNode {
  const pathname = useRouterState({
    select: (route) => route.location.pathname,
  });
  const navigate = useNavigate();
  const startConnected = adsSearch().connected === "1";
  const [googleConnected, setGoogleConnected] = useState(startConnected);
  const [metaConnected, setMetaConnected] = useState(startConnected);
  const searchReview = useRouterState({
    select: (route) => route.location.search.review,
  });
  const reviewOn = pathname === "/cms/ads/new" && searchReview === "1";

  useEffect(() => {
    if (pathname !== "/cms/ads") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("view") ?? params.get("scene");
    if (!raw || raw === "list") {
      return;
    }
    if (raw === "compact") {
      void navigate({
        replace: true,
        search: adsSearch({ compact: "1", view: undefined, scene: undefined }),
        to: "/cms/ads",
      });
      return;
    }
    if (raw === "flow") {
      void navigate({
        replace: true,
        search: adsSearch({ view: undefined, scene: undefined }),
        to: "/cms/ads/new",
      });
      return;
    }
    if (raw === "review") {
      void navigate({
        replace: true,
        search: adsSearch({
          review: "1",
          view: undefined,
          scene: undefined,
        }),
        to: "/cms/ads/new",
      });
      return;
    }
    if (raw === "detail") {
      void navigate({
        params: { adId: defaultDetailId },
        replace: true,
        search: adsSearch({ view: undefined, scene: undefined }),
        to: "/cms/ads/$adId",
      });
    }
  }, [navigate, pathname]);

  return (
    <AdsConnectContext.Provider
      value={{
        googleConnected,
        metaConnected,
        onConnectGoogle: () => setGoogleConnected(true),
        onConnectMeta: () => setMetaConnected(true),
      }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DevStrip
          groups={[
            {
              title: "Ads",
              tabs: [
                {
                  id: "list",
                  label: "My ads",
                  on: pathname === "/cms/ads",
                  onSelect: () => {
                    void navigate({
                      search: adsSearch({
                        review: undefined,
                        view: undefined,
                        scene: undefined,
                      }),
                      to: "/cms/ads",
                    });
                  },
                },
                {
                  id: "flow",
                  label: "New ad",
                  on: pathname === "/cms/ads/new" && !reviewOn,
                  onSelect: () => {
                    void navigate({
                      search: adsSearch({ review: undefined }),
                      to: "/cms/ads/new",
                    });
                  },
                },
                {
                  id: "review",
                  label: "Review",
                  on: reviewOn,
                  onSelect: () => {
                    void navigate({
                      search: adsSearch({ review: "1" }),
                      to: "/cms/ads/new",
                    });
                  },
                },
                {
                  id: "connected",
                  label: "All connected",
                  on: googleConnected && metaConnected,
                  onSelect: () => {
                    setGoogleConnected(true);
                    setMetaConnected(true);
                  },
                },
                {
                  id: "archive",
                  label: "Archive",
                  on: adsSearch().archive === "1",
                  onSelect: () => {
                    void navigate({
                      search: adsSearch({
                        archive: "1",
                        review: undefined,
                        view: undefined,
                        scene: undefined,
                      }),
                      to: "/cms/ads",
                    });
                  },
                },
              ],
            },
          ]}
        />
        <Outlet />
      </div>
    </AdsConnectContext.Provider>
  );
}

export function AdsListPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const ads = useAdsConnect();
  const [compact, setCompact] = useState(adsSearch().compact === "1");

  return (
    <AdsList
      compact={compact}
      googleConnected={ads.googleConnected}
      metaConnected={ads.metaConnected}
      onConnectGoogle={ads.onConnectGoogle}
      onConnectMeta={ads.onConnectMeta}
      onOpenDestinations={openDestinations}
      onToggleCompact={() => setCompact((value) => !value)}
    />
  );
}
