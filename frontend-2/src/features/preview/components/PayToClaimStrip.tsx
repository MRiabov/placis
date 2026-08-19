import { SignInButton, SignUpButton, useAuth } from "@clerk/react";
import {
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  createPreviewClaimCheckout,
  type PreviewClaimCheckoutResponse,
} from "../api/preview";
import { Button } from "@/shared/ui/button";
import { currentPathWithQuery } from "@/shared/lib/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

const clerkPublishableKey = (import.meta.env as {
  VITE_CLERK_PUBLISHABLE_KEY?: string;
}).VITE_CLERK_PUBLISHABLE_KEY;

type PayToClaimStripProps = {
  initialOpen?: boolean;
  previewToken: string;
};

type ClaimAuthState = {
  configured: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
};

type ClaimCheckoutMutation = UseMutationResult<
  PreviewClaimCheckoutResponse | undefined,
  Error,
  void,
  unknown
>;

export function PayToClaimStrip({
  initialOpen = false,
  previewToken,
}: PayToClaimStripProps): ReactNode {
  if (clerkPublishableKey) {
    return (
      <ClerkClaimStrip initialOpen={initialOpen} previewToken={previewToken} />
    );
  }

  return (
    <ClaimStripContent
      authState={{ configured: false, isLoaded: true, isSignedIn: false }}
      initialOpen={initialOpen}
      previewToken={previewToken}
    />
  );
}

function ClerkClaimStrip(props: PayToClaimStripProps): ReactNode {
  const { isLoaded, isSignedIn } = useAuth();
  const returnUrl = currentPathWithQuery();

  return (
    <ClaimStripContent
      authActions={
        <>
          <SignInButton mode="redirect" fallbackRedirectUrl={returnUrl}>
            <Button type="button" variant="outline">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="redirect" fallbackRedirectUrl={returnUrl}>
            <Button type="button">Create account</Button>
          </SignUpButton>
        </>
      }
      authState={{
        configured: true,
        isLoaded,
        isSignedIn: Boolean(isSignedIn),
      }}
      {...props}
    />
  );
}

interface PayToClaimStripFixtureProps {
  authState: ClaimAuthState;
  initialOpen?: boolean;
}

export function PayToClaimStripFixture({
  authState,
  initialOpen = true,
}: PayToClaimStripFixtureProps): ReactNode {
  return (
    <ClaimStripContent
      authActions={
        <>
          <Button type="button" variant="outline">
            Sign in
          </Button>
          <Button type="button">Create account</Button>
        </>
      }
      authState={authState}
      initialOpen={initialOpen}
      previewToken="fixture-token"
    />
  );
}

interface ClaimStripContentProps {
  authActions?: ReactNode;
  authState: ClaimAuthState;
  initialOpen?: boolean;
  previewToken: string;
}

function ClaimStripContent({
  authActions,
  authState,
  initialOpen = false,
  previewToken,
}: ClaimStripContentProps): ReactNode {
  const canCreateCheckout =
    authState.configured && authState.isLoaded && authState.isSignedIn;
  const checkout = useMutation({
    mutationFn: async () => {
      if (!canCreateCheckout) {
        throw new Error("Sign-in required before checkout");
      }
      return createPreviewClaimCheckout(previewToken);
    },
  });
  return (
    <div className="border-white/10 border-b bg-claim-surface px-3 py-2 text-claim-surface-text shadow-sm sm:px-6 sm:py-3 lg:px-8">
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-between gap-2 sm:min-h-11 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-claim-accent text-claim-on-accent sm:size-9">
            <ShieldCheck className="size-4 sm:size-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[13px] leading-5 sm:text-sm">
              Pay to activate this website
            </div>
            <div className="hidden truncate text-claim-muted text-xs leading-5 md:block">
              Pay, the website address is reserved. The website stays
              unpublished.
            </div>
          </div>
        </div>
        <Dialog defaultOpen={initialOpen}>
          <DialogTrigger asChild>
            <Button
              className="h-8 shrink-0 rounded-md bg-claim-accent px-2.5 font-semibold text-claim-on-accent text-xs hover:bg-claim-accent-hover sm:h-9 sm:px-3"
              type="button"
            >
              <BadgeCheck className="size-3.5" />
              Claim
              <ArrowRight className="size-3.5" />
            </Button>
          </DialogTrigger>
          <ClaimDialogBody
            authActions={authActions}
            authState={authState}
            canCreateCheckout={canCreateCheckout}
            checkout={checkout}
          />
        </Dialog>
      </div>
    </div>
  );
}

interface ClaimDialogBodyProps {
  authActions?: ReactNode;
  authState: ClaimAuthState;
  canCreateCheckout: boolean;
  checkout: ClaimCheckoutMutation;
}

function ClaimDialogBody({
  authActions,
  authState,
  canCreateCheckout,
  checkout,
}: ClaimDialogBodyProps): ReactNode {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Claim Dublin Roof Repairs</DialogTitle>
        <DialogDescription>
          Sign in or create an account first, then pay. The website address is
          reserved. The website stays unpublished.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <ClaimAccountStatusCard authState={authState} />
        <ClaimPriceCard />
        {checkout.data ? <ClaimCheckoutReadyCard /> : null}
        {checkout.error ? <ClaimCheckoutErrorCard /> : null}
      </div>
      <DialogFooter>
        {!canCreateCheckout ? authActions : null}
        {canCreateCheckout ? (
          checkout.data ? (
            <OpenCheckoutButton url={checkout.data.url} />
          ) : (
            <CreateCheckoutButton
              pending={checkout.isPending}
              onCheckout={() => checkout.mutate()}
            />
          )
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}

interface ClaimAccountStatusCardProps {
  authState: ClaimAuthState;
}

function ClaimAccountStatusCard({
  authState,
}: ClaimAccountStatusCardProps): ReactNode {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-claim-check-surface text-claim-check">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="font-semibold">Account required before payment</div>
          <div className="mt-1 text-muted-foreground text-sm">
            {authState.configured
              ? authState.isLoaded
                ? authState.isSignedIn
                  ? "Signed in. Checkout can now be created for this website."
                  : "Sign in or create an account so the payment can be tied to the owner."
                : "Checking sign-in state..."
              : "Sign in with the owner account before checkout."}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimPriceCard(): ReactNode {
  return (
    <div className="rounded-lg border bg-zinc-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Website activation</div>
          <div className="mt-1 text-muted-foreground text-sm">
            Secure checkout, preview links, and owner handoff.
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">EUR 4,900</div>
          <div className="text-muted-foreground text-xs">
            one-time activation
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimCheckoutReadyCard(): ReactNode {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
      <div>
        <div className="font-semibold text-emerald-950">Checkout ready</div>
        <div className="mt-1 text-emerald-800">
          Continue to secure Stripe checkout to activate this website.
        </div>
      </div>
    </div>
  );
}

function ClaimCheckoutErrorCard(): ReactNode {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
      Checkout could not be created. Confirm the owner account and payment
      setup, then try again.
    </div>
  );
}

interface OpenCheckoutButtonProps {
  url: string;
}

function OpenCheckoutButton({ url }: OpenCheckoutButtonProps): ReactNode {
  return (
    <Button
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      type="button"
    >
      <ExternalLink className="size-4" />
      Open checkout
    </Button>
  );
}

interface CreateCheckoutButtonProps {
  onCheckout: () => void;
  pending: boolean;
}

function CreateCheckoutButton({
  onCheckout,
  pending,
}: CreateCheckoutButtonProps): ReactNode {
  return (
    <Button disabled={pending} onClick={onCheckout} type="button">
      <ExternalLink className="size-4" />
      {pending ? "Creating checkout" : "Create checkout"}
    </Button>
  );
}
