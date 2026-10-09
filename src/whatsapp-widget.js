const widgets = (root) => [
  ...(root.matches?.('[data-whatsapp-widget]') ? [root] : []),
  ...root.querySelectorAll('[data-whatsapp-widget]'),
];

export function initializeWhatsAppWidget(root = document) {
  widgets(root).forEach((widget) => {
    if (widget.dataset.whatsappReady === 'true') return;
    widget.dataset.whatsappReady = 'true';

    const launcher = widget.querySelector('[data-whatsapp-launcher]');
    const panel = widget.querySelector('[data-whatsapp-panel]');
    const close = widget.querySelector('[data-whatsapp-close]');
    const message = widget.querySelector('[data-whatsapp-message]');
    const link = widget.querySelector('[data-whatsapp-link]');
    if (!launcher || !panel || !close || !message || !link) return;

    const number = widget.dataset.whatsappNumber?.replace(/\D/g, '');
    const defaultMessage = widget.dataset.whatsappDefaultMessage || message.value;
    const listeners = new AbortController();
    const { signal } = listeners;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isOpen = false;
    let animation;
    let transitionId = 0;
    const syncMessageLink = () => {
      const text = message.value.trim() || defaultMessage;
      link.href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    };
    const setOpen = (open, restoreFocus = false) => {
      if (open === isOpen) return;
      isOpen = open;
      const currentTransition = ++transitionId;
      animation?.cancel();
      launcher.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        if (!reduceMotion.matches && panel.animate) {
          animation = panel.animate(
            [
              { opacity: 0, transform: 'translateY(12px) scale(.97)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
            { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' },
          );
        }
        close.focus({ preventScroll: true });
      } else {
        if (restoreFocus) launcher.focus({ preventScroll: true });
        if (!reduceMotion.matches && panel.animate) {
          animation = panel.animate(
            [
              { opacity: 1, transform: 'translateY(0) scale(1)' },
              { opacity: 0, transform: 'translateY(8px) scale(.985)' },
            ],
            { duration: 140, easing: 'ease-in' },
          );
          animation.onfinish = () => {
            if (currentTransition === transitionId) panel.hidden = true;
          };
        } else {
          panel.hidden = true;
        }
      }
    };

    syncMessageLink();
    message.addEventListener('input', syncMessageLink, { signal });
    launcher.addEventListener('click', () => setOpen(!isOpen), { signal });
    close.addEventListener('click', () => setOpen(false, true), { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) setOpen(false, true);
    }, { signal });
    document.addEventListener('click', (event) => {
      if (isOpen && !widget.contains(event.target)) setOpen(false);
    }, { signal });
    document.addEventListener('shopify:section:unload', (event) => {
      if (event.target.contains(widget)) listeners.abort();
    }, { signal });
  });
}
