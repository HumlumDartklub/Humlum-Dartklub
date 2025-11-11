'use client';
import React from 'react';

const TERMS_VERSION = '2025-11-10 v1.0';

type Props = {
  /** Hvis du har flere formularer på siden kan du pege på en specifik via CSS-selector. */
  formSelector?: string; // fx '#memberForm'
  /** Tekstlinks kan ændres til dine sider/PDF'er */
  termsHref?: string;
  privacyHref?: string;
  /** Knappens label */
  submitLabel?: string;
};

export default function TermsGate({
  formSelector = 'form',
  termsHref = '/om/vedtaegter',
  privacyHref = '/om/privatliv',
  submitLabel = 'Send'
}: Props) {
  const [checked, setChecked] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sørg for at hidden felter (terms_*) findes i formularen
  React.useEffect(() => {
    const form: HTMLFormElement | null =
      (containerRef.current?.closest('form') as HTMLFormElement | null) ||
      (document.querySelector(formSelector) as HTMLFormElement | null);

    if (!form) return;

    const ensure = (name: string, value: string) => {
      let el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (!el) {
        el = document.createElement('input');
        el.type = 'hidden';
        el.name = name;
        form.appendChild(el);
      }
      el.value = value;
    };

    // Sæt/ryd værdier når checkbox ændres
    if (checked) {
      ensure('terms_accept', 'YES');
      ensure('terms_version', TERMS_VERSION);
      const ts = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const stamp = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`;
      ensure('terms_timestamp', stamp);
    } else {
      // Hvis ikke afkrydset, sørg for at vi ikke sender en YES ved en fejl
      const el = form.querySelector<HTMLInputElement>('input[name="terms_accept"]');
      if (el) el.value = '';
    }
  }, [checked, formSelector]);

  return (
    <div ref={containerRef} className="mt-4 space-y-2">
      <label className="flex items-start gap-2">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          className="mt-1"
          required
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="text-sm">
          Jeg har læst og accepterer{' '}
          <a href={termsHref} target="_blank" rel="noopener noreferrer" className="underline">
            Vedtægter
          </a>{' '}
          og{' '}
          <a href={privacyHref} target="_blank" rel="noopener noreferrer" className="underline">
            Privatlivspolitik
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={!checked}
        aria-disabled={!checked}
        className={
          'rounded-md px-4 py-2 text-white ' +
          (checked ? 'bg-green-600 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed')
        }
        title={checked ? submitLabel : 'Sæt flueben for at fortsætte'}
      >
        {submitLabel}
      </button>
    </div>
  );
}
