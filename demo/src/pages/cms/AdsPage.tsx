import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { DevStrip } from "@/dev/DevStrip";
import { AdsList } from "@/pages/cms/ads/AdsList";
import { adsSearch } from "@/pages/cms/ads/search";
import { useCmsLayout } from "@/shell/CmsShell";

const defaultDetailId = "roofing-replacement-spring";

type AdsSession = {
  googleConnected: boolean;
  metaConnected: boolean;
  onConnectGoogle: () => void;
  onConnectMeta: () => void;
};

const AdsSessionContext = createContext<AdsSession | null>(null);

function useAdsSession(): AdsSession {
  const value = useContext(AdsSessionContext);
  if (!value) {
    throw new Error("useAdsSession must be used inside AdsPage");
  }
  return value;
}

export function AdsPage(): ReactNode {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();
  const startConnected = adsSearch().connected === "1";
  const [googleConnected, setGoogleConnected] = useState(startConnected);
  const [metaConnected, setMetaConnected] = useState(startConnected);
  const searchReview = useRouterState({
    select: (state) => state.location.search.review,
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
    <AdsSessionContext.Provider
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
              ],
            },
          ]}
        />
        <Outlet />
      </div>
    </AdsSessionContext.Provider>
  );
}

export function AdsListPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const session = useAdsSession();
  const [compact, setCompact] = useState(adsSearch().compact === "1");

  return (
    <AdsList
      compact={compact}
      googleConnected={session.googleConnected}
      metaConnected={session.metaConnected}
      onConnectGoogle={session.onConnectGoogle}
      onConnectMeta={session.onConnectMeta}
      onOpenDestinations={openDestinations}
      onToggleCompact={() => setCompact((value) => !value)}
    />
  );
}
