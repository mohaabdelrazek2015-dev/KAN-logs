// No live tracking API yet, so a submitted reference shows the "contact our team" message.
const form = document.querySelector('[data-tracking-form]');
const result = document.querySelector('[data-tracking-result]');

if (form && result) {
  const input = form.elements.reference;

  // homepage form sends ?ref=
  const params = new URLSearchParams(location.search);
  const prefill = params.get('ref') ?? params.get('reference');
  if (prefill) input.value = prefill.trim();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    result.hidden = false;
  });

  input.addEventListener('input', () => {
    result.hidden = true;
  });
}
