import { createSignal } from 'solid-js';
import { useReview } from '../ReviewProvider/review.context';

export function usePinGate() {
  const review = useReview();
  const [pin, setPin] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (busy() || !pin().trim()) return;
    setBusy(true);
    setError(null);
    const outcome = await review.login(pin());
    setBusy(false);
    if (!outcome.ok) setError(outcome.message);
  }

  function onPinInput(event: Event & { currentTarget: HTMLInputElement }) {
    setPin(event.currentTarget.value);
  }

  return {
    needsPin: () => !review.session(),
    pin,
    busy,
    message: () => error() ?? review.notice(),
    submitDisabled: () => busy() || !pin().trim(),
    onSubmit,
    onPinInput,
  };
}
