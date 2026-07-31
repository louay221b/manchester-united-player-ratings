import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const externalLinks = [
  {
    href: 'https://www.youtube.com/@yamenashour',
    labelKey: 'footer.youtubeYamen',
  },
  {
    href: 'https://www.youtube.com/@halawaney',
    labelKey: 'footer.youtubeHalawaney',
  },
  {
    href: 'https://www.facebook.com/yamen.ashour',
    labelKey: 'footer.facebook',
  },
  {
    href: 'https://twitter.com/Yamen_Ashour',
    labelKey: 'footer.twitter',
  },
  {
    href: 'https://www.paypal.com/paypalme/yamenashour',
    labelKey: 'footer.support',
  },
];

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        <section aria-labelledby="footer-contact" className="space-y-3">
          <h2
            id="footer-contact"
            className="text-sm font-black uppercase tracking-[0.14em] text-red-200"
          >
            {t('footer.contact')}
          </h2>
          <a
            href="mailto:yamen.a.ashour@gmail.com"
            className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold text-zinc-200 hover:text-white"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            yamen.a.ashour@gmail.com
          </a>
        </section>

        <section aria-labelledby="footer-links" className="space-y-3">
          <h2
            id="footer-links"
            className="text-sm font-black uppercase tracking-[0.14em] text-red-200"
          >
            {t('footer.socialLinks')}
          </h2>
          <ul className="space-y-2 text-sm font-semibold">
            {externalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-md text-zinc-200 hover:text-white"
                >
                  {t(link.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="footer-development" className="space-y-3">
          <h2
            id="footer-development"
            className="text-sm font-black uppercase tracking-[0.14em] text-red-200"
          >
            {t('footer.developedBy')}
          </h2>
          <p className="text-sm font-semibold text-zinc-200">
            {t('footer.developedBy')} Ing. Louay Tanazefti
          </p>
          <a
            href="mailto:tanazeftilouay@gmail.com"
            className="focus-ring inline-flex rounded-md text-sm font-semibold text-zinc-200 hover:text-white"
          >
            tanazeftilouay@gmail.com
          </a>
        </section>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-xs font-semibold text-zinc-400">
        <p>{t('footer.copyright', { year: currentYear })}</p>
        <p className="mt-1">{t('footer.independentDisclaimer')}</p>
      </div>
    </footer>
  );
}
