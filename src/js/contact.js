// Enquiry form -> PocketBase "enquiries" collection
// POST {API_BASE}/api/collections/enquiries/records  (name, company, email, phone, service, message)
// API_BASE can be overridden at build time with VITE_API_BASE.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '/hcgi/platform').replace(/\/$/, '');
const ENDPOINT = `${API_BASE}/api/collections/enquiries/records`;
const ERROR_MESSAGE = 'We couldn’t send your enquiry. Please try again.';

const form = document.querySelector('[data-enquiry-form]');
const success = document.querySelector('[data-form-success]');
const errorBox = document.querySelector('[data-form-error]');
const submit = form?.querySelector('[type="submit"]');
const submitLabel = form?.querySelector('[data-submit-label]');

if (form) {
  // links from /services pass ?service=...
  const requested = new URLSearchParams(location.search).get('service');
  const select = form.elements.service;
  if (requested && [...select.options].some((o) => o.value === requested)) select.value = requested;

  const setBusy = (busy) => {
    submit.disabled = busy;
    submitLabel.textContent = busy ? 'Sending…' : 'Send enquiry';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    setBusy(true);

    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      errorBox.textContent = ERROR_MESSAGE;
      errorBox.hidden = false;
    } finally {
      setBusy(false);
    }
  });

  document.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
}
