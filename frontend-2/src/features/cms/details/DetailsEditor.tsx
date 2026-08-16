import { Building2, ImageIcon, RefreshCw, Save, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import type {
  CmsBusinessProfile,
  CmsBusinessProfilePatch,
  CmsMediaAsset,
} from "../api/cms";
import { assetLabel, assetPreviewUrl, previewFixtureUrl } from "../editor/media/mediaModel";
import {
  CollectionChecklist,
  CollectionContextCard,
  CollectionHeader,
  CollectionStatusPill,
  CollectionUsageItem,
  CollectionWorkspace,
} from "./collectionWorkspace";
import {
  emptyForm,
  formToPatch,
  openingHourDayLabel,
  profileToForm,
  timeOptions,
  type DetailsFormState,
  type OpeningHourDay,
  type OpeningHourFormRow,
} from "./detailsModel";
import { Field } from "./Field";

type UpdateForm = (patch: Partial<DetailsFormState>) => void;

function DetailsEditor({
  error,
  mediaAssets,
  profile,
  saving,
  onRefresh,
  onSave,
}: {
  error: string | null;
  mediaAssets: CmsMediaAsset[];
  profile: CmsBusinessProfile | null;
  saving: boolean;
  onRefresh: () => void;
  onSave: (patch: CmsBusinessProfilePatch) => void;
}): ReactNode {
  const [form, setForm] = useState<DetailsFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<CmsBusinessProfile | null>(null);

  // Mirror the server profile into the form state when it arrives or changes
  // (React's documented adjust-state-on-prop-change pattern; matches the old
  // app's effect but without the synchronous setState inside an effect).
  if (profile !== loadedProfile) {
    setLoadedProfile(profile);
    if (profile) {
      setForm(profileToForm(profile));
      setFormError(null);
    }
  }

  const updatedAt = profile?.updated_at;
  const updatedLabel = useMemo(() => {
    if (!updatedAt) {
      return "Not saved yet";
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(updatedAt));
  }, [updatedAt]);
  const validationItems = [
    { done: Boolean(form.businessName.trim()), label: "Business name" },
    { done: Boolean(form.phone.trim()), label: "Marketing phone" },
    { done: Boolean(form.email.trim()), label: "Marketing email" },
    { done: Boolean(form.address.trim()), label: "Business location" },
    { done: Boolean(form.services.trim()), label: "Featured services" },
    {
      done: form.openingHours.some(
        (row) => row.isClosed || row.opensAt || row.closesAt || row.note.trim(),
      ),
      label: "Opening hours",
    },
  ];
  const completedValidationItems = validationItems.filter((entry) => entry.done).length;

  function updateForm(patch: Partial<DetailsFormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setFormError(null);
  }

  function submit() {
    try {
      onSave(formToPatch(form));
    } catch (parseError) {
      setFormError(
        parseError instanceof Error
          ? parseError.message
          : "Profile details are not valid",
      );
    }
  }

  return (
    <section className="cms-details-editor min-h-0 overflow-auto px-4 py-5">
      <div className="cms-details-content mx-auto grid max-w-[1320px] gap-5">
        <DetailsHeroHeader
          canSave={Boolean(form.businessName.trim())}
          profileActive={Boolean(profile)}
          saving={saving}
          updatedLabel={updatedLabel}
          onRefresh={onRefresh}
          onSubmit={submit}
        />

        {error || formError ? (
          <div className="rounded-cms-card border border-cms-error-strong bg-cms-error-surface p-3 text-cms-error text-sm">
            {formError || error}
          </div>
        ) : null}

        <CollectionWorkspace className="is-details cms-details-workspace">
          <div className="cms-details-main">
            <div className="cms-details-form-grid">
              <IdentityPanel form={form} updateForm={updateForm} />
              <ContactPresencePanel
                form={form}
                mediaAssets={mediaAssets}
                updateForm={updateForm}
              />
              <ServicesAvailabilityPanel form={form} updateForm={updateForm} />
              <LegalCompliancePanel form={form} updateForm={updateForm} />
            </div>
          </div>
          <DetailsSidebar
            completedValidationItems={completedValidationItems}
            form={form}
            validationItems={validationItems}
          />
        </CollectionWorkspace>
      </div>
    </section>
  );
}

function DetailsHeroHeader({
  canSave,
  profileActive,
  saving,
  updatedLabel,
  onRefresh,
  onSubmit,
}: {
  canSave: boolean;
  profileActive: boolean;
  saving: boolean;
  updatedLabel: string;
  onRefresh: () => void;
  onSubmit: () => void;
}): ReactNode {
  return (
    <div className="cms-details-hero">
      <CollectionHeader
        actions={
          <>
            <button
              className="button-secondary"
              disabled={saving}
              onClick={onRefresh}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
            <button
              className="button-primary"
              disabled={saving || !canSave || !profileActive}
              onClick={onSubmit}
              type="button"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save details
            </button>
          </>
        }
        description="Keep the business facts that power your website, contact forms, SEO, and legal disclosures in one place."
        eyebrow="Website foundations"
        icon={<Building2 aria-hidden="true" />}
        meta={<span>Last saved {updatedLabel}</span>}
        status={
          <CollectionStatusPill
            label={profileActive ? "Profile active" : "Loading profile"}
            tone={profileActive ? "success" : "muted"}
          />
        }
        title="Business details"
      />
    </div>
  );
}

function IdentityPanel({
  form,
  updateForm,
}: {
  form: DetailsFormState;
  updateForm: UpdateForm;
}): ReactNode {
  return (
    <DetailsPanel
      description="The name and story customers should recognise."
      title="Identity"
    >
      <div className="cms-details-field-grid">
        <Field label="Business name">
          <input
            className="cms-careers-input"
            value={form.businessName}
            onChange={(event) =>
              updateForm({ businessName: event.target.value })
            }
          />
        </Field>
        <Field label="Legal name">
          <input
            className="cms-careers-input"
            value={form.legalName}
            onChange={(event) => updateForm({ legalName: event.target.value })}
          />
        </Field>
        <Field label="Trade">
          <input
            className="cms-careers-input"
            value={form.trade}
            onChange={(event) => updateForm({ trade: event.target.value })}
          />
        </Field>
        <Field label="Established year">
          <input
            className="cms-careers-input"
            inputMode="numeric"
            value={form.establishedYear}
            onChange={(event) =>
              updateForm({ establishedYear: event.target.value })
            }
          />
        </Field>
      </div>
      <Field label="Business description">
        <textarea
          className="cms-careers-textarea"
          value={form.description}
          onChange={(event) =>
            updateForm({ description: event.target.value })
          }
        />
      </Field>
    </DetailsPanel>
  );
}

function ContactPresencePanel({
  form,
  mediaAssets,
  updateForm,
}: {
  form: DetailsFormState;
  mediaAssets: CmsMediaAsset[];
  updateForm: UpdateForm;
}): ReactNode {
  return (
    <DetailsPanel
      description="Where customers can find and contact you."
      title="Contact and presence"
    >
      <div className="cms-details-field-grid">
        <Field label="Marketing phone">
          <input
            className="cms-careers-input"
            value={form.phone}
            onChange={(event) => updateForm({ phone: event.target.value })}
          />
        </Field>
        <Field label="Marketing email">
          <input
            className="cms-careers-input"
            type="email"
            value={form.email}
            onChange={(event) => updateForm({ email: event.target.value })}
          />
        </Field>
        <Field label="Website URL">
          <input
            className="cms-careers-input"
            value={form.websiteUrl}
            onChange={(event) =>
              updateForm({ websiteUrl: event.target.value })
            }
          />
        </Field>
      </div>
      <LogoPicker
        assets={mediaAssets}
        legacyPreviewUrl={form.logoPreviewUrl}
        selectedAssetId={form.logoAssetId}
        onClear={() =>
          updateForm({
            logoAssetId: "",
            logoAssetTouched: true,
            logoPreviewUrl: "",
          })
        }
        onSelect={(asset) =>
          updateForm({
            logoAssetId: asset.id,
            logoAssetTouched: true,
            logoPreviewUrl: assetPreviewUrl(asset),
          })
        }
      />
      <Field label="Business location">
        <textarea
          className="cms-careers-textarea is-short"
          value={form.address}
          onChange={(event) => updateForm({ address: event.target.value })}
        />
      </Field>
    </DetailsPanel>
  );
}

function ServicesAvailabilityPanel({
  form,
  updateForm,
}: {
  form: DetailsFormState;
  updateForm: UpdateForm;
}): ReactNode {
  return (
    <DetailsPanel
      description="The services and places your website should describe."
      title="Services and availability"
    >
      <div className="cms-details-field-grid">
        <Field label="Service areas">
          <textarea
            className="cms-careers-textarea"
            value={form.serviceArea}
            onChange={(event) =>
              updateForm({ serviceArea: event.target.value })
            }
          />
        </Field>
        <Field label="Featured services">
          <textarea
            className="cms-careers-textarea"
            value={form.services}
            onChange={(event) => updateForm({ services: event.target.value })}
          />
        </Field>
      </div>
      <OpeningHoursEditor
        rows={form.openingHours}
        onChange={(openingHours) => updateForm({ openingHours })}
      />
    </DetailsPanel>
  );
}

function LegalCompliancePanel({
  form,
  updateForm,
}: {
  form: DetailsFormState;
  updateForm: UpdateForm;
}): ReactNode {
  return (
    <DetailsPanel
      description="Optional details for your footer and public disclosures."
      title="Legal and compliance"
    >
      <div className="cms-details-field-grid">
        <Field label="Company number">
          <input
            className="cms-careers-input"
            value={form.companyNumber}
            onChange={(event) =>
              updateForm({ companyNumber: event.target.value })
            }
          />
        </Field>
        <Field label="VAT number">
          <input
            className="cms-careers-input"
            value={form.vatNumber}
            onChange={(event) => updateForm({ vatNumber: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Registered office">
        <textarea
          className="cms-careers-textarea is-short"
          value={form.registeredOffice}
          onChange={(event) =>
            updateForm({ registeredOffice: event.target.value })
          }
        />
      </Field>
    </DetailsPanel>
  );
}

function DetailsSidebar({
  completedValidationItems,
  form,
  validationItems,
}: {
  completedValidationItems: number;
  form: DetailsFormState;
  validationItems: Array<{ done: boolean; label: string }>;
}): ReactNode {
  return (
    <aside className="cms-details-side grid gap-3">
      <CollectionContextCard
        description="These website areas read from this profile when pages are generated or rendered."
        title="Used on website"
      >
        <CollectionUsageItem
          detail="Logo, business name, phone"
          label="Header and footer"
          live={Boolean(
            form.businessName &&
              (form.phone || form.logoAssetId || form.logoPreviewUrl),
          )}
        />
        <CollectionUsageItem
          detail="Address, map, email, hours"
          label="Contact page"
          live={Boolean(form.address && form.email)}
        />
        <CollectionUsageItem
          detail="Service areas and featured services"
          label="Service pages"
          live={Boolean(form.services || form.serviceArea)}
        />
        <CollectionUsageItem
          detail="Company number, VAT, registered office"
          label="Footer legal"
          live={Boolean(form.companyNumber || form.vatNumber)}
        />
      </CollectionContextCard>

      <CollectionContextCard
        description="Complete these facts to make every website surface useful."
        title="Profile readiness"
      >
        <div className="cms-details-readiness-summary">
          <strong>{completedValidationItems}/{validationItems.length}</strong>
          <span>key details complete</span>
        </div>
        <div className="cms-details-progress" aria-hidden="true">
          <span style={{ width: `${(completedValidationItems / validationItems.length) * 100}%` }} />
        </div>
        <CollectionChecklist items={validationItems} />
      </CollectionContextCard>

      <CollectionContextCard
        description="Common facts that can be inserted into website copy and page templates."
        title="Website variables"
      >
        <div className="cms-variable-token-row cms-details-variable-tokens">
          {[
            "Business name",
            "Phone",
            "Email",
            "Service area",
            "Opening hours",
            "Website URL",
            "Logo",
          ].map((label) => (
            <span className="cms-variable-token" key={label}>
              {label}
            </span>
          ))}
        </div>
      </CollectionContextCard>
    </aside>
  );
}

function LogoPicker({
  assets,
  legacyPreviewUrl,
  selectedAssetId,
  onClear,
  onSelect,
}: {
  assets: CmsMediaAsset[];
  legacyPreviewUrl: string;
  selectedAssetId: string;
  onClear: () => void;
  onSelect: (asset: CmsMediaAsset) => void;
}) {
  const imageAssets = assets.filter((asset) =>
    ["image", "logo", "generated_image"].includes(asset.asset_type),
  );
  const selectedAsset =
    imageAssets.find((asset) => asset.id === selectedAssetId) ?? null;
  const previewUrl = selectedAsset
    ? assetPreviewUrl(selectedAsset)
    : legacyPreviewUrl;
  return (
    <div className="cms-details-logo-picker">
      <div className="cms-details-subsection-heading">
        <span>Logo</span>
        <span>{previewUrl ? "Selected for your website" : "Not selected"}</span>
      </div>
      <div className="cms-details-logo-layout">
        <div className="cms-details-logo-current">
          {previewUrl ? (
            <img
              alt=""
              className="max-h-24 max-w-full object-contain"
              src={previewFixtureUrl(previewUrl)}
            />
          ) : (
            <ImageIcon aria-hidden="true" className="h-8 w-8 text-cms-muted" />
          )}
        </div>
        <div className="cms-details-logo-options">
          <div className="cms-details-logo-grid">
            {imageAssets.length ? (
              imageAssets.map((asset) => {
                const active = asset.id === selectedAssetId;
                return (
                  <button
                    className={`cms-media-card ${active ? "is-active" : ""}`}
                    key={asset.id}
                    onClick={() => onSelect(asset)}
                    type="button"
                  >
                    <span className="cms-media-thumb">
                      <img alt="" src={previewFixtureUrl(assetPreviewUrl(asset))} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-sm">
                        {assetLabel(asset)}
                      </span>
                      <span className="block truncate text-cms-muted text-xs">
                        Website image
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="cms-details-logo-empty">
                No website images are in the media library yet.
              </div>
            )}
          </div>
          {previewUrl ? (
            <button className="button-secondary justify-self-start" onClick={onClear} type="button">
              <X aria-hidden="true" className="h-4 w-4" />
              Clear logo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OpeningHoursEditor({
  rows,
  onChange,
}: {
  rows: OpeningHourFormRow[];
  onChange: (rows: OpeningHourFormRow[]) => void;
}) {
  function updateRow(day: OpeningHourDay, patch: Partial<OpeningHourFormRow>) {
    onChange(
      rows.map((row) =>
        row.day === day
          ? {
              ...row,
              ...patch,
            }
          : row,
      ),
    );
  }
  return (
    <div className="grid gap-3">
      <div className="cms-details-subsection-heading">
        <span>Opening hours</span>
        <span>Shown on your contact pages</span>
      </div>
      <div className="cms-details-hours-list">
        {rows.map((row) => (
          <div
            className={`cms-details-hours-row ${row.isClosed ? "is-closed" : ""}`}
            key={row.day}
          >
            <div className="cms-details-hours-day">
              {openingHourDayLabel(row.day)}
            </div>
            <div className="cms-details-hours-controls">
              <select
                aria-label={`${openingHourDayLabel(row.day)} opening time`}
                className="cms-careers-input"
                disabled={row.isClosed}
                value={row.opensAt}
                onChange={(event) =>
                  updateRow(row.day, { opensAt: event.target.value })
                }
              >
                <option value="">Opens</option>
                {timeOptions.map((time) => (
                  <option value={time} key={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">to</span>
              <select
                aria-label={`${openingHourDayLabel(row.day)} closing time`}
                className="cms-careers-input"
                disabled={row.isClosed}
                value={row.closesAt}
                onChange={(event) =>
                  updateRow(row.day, { closesAt: event.target.value })
                }
              >
                <option value="">Closes</option>
                {timeOptions.map((time) => (
                  <option value={time} key={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <label className="cms-details-hours-closed">
              <input
                checked={row.isClosed}
                type="checkbox"
                onChange={(event) =>
                  updateRow(row.day, {
                    closesAt: event.target.checked ? "" : row.closesAt,
                    isClosed: event.target.checked,
                    opensAt: event.target.checked ? "" : row.opensAt,
                  })
                }
              />
              Closed
            </label>
            <input
              aria-label={`${openingHourDayLabel(row.day)} note`}
              className="cms-careers-input cms-details-hours-note"
              placeholder="Appointment note"
              value={row.note}
              onChange={(event) =>
                updateRow(row.day, { note: event.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailsPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="cms-details-form-panel">
      <div className="cms-details-panel-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

export { DetailsEditor };
