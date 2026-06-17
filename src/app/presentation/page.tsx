import type { Metadata } from 'next';
import { PresentationPage } from '@/components/marketing/presentation-page';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${brand.name} — Gestion scolaire tout-en-un`,
  description:
    'Simplifiez la gestion de votre établissement : élèves, caisse, présences et rapports. Application rapide et intuitive pour les écoles en RDC.',
};

export default function PresentationRoutePage() {
  return <PresentationPage />;
}
