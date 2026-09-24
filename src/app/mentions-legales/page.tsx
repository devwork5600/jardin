import type { Metadata } from "next";
import Link from "next/link";
import {
  DemoNotice,
  LegalLink,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — Jardin Indoor",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <DemoNotice>
        {`Jardin Indoor est le nom d’une boutique indépendante réelle, installée à Vannes. Ce site en est une refonte de démonstration, réalisée à titre de portfolio : ce n’est pas le site officiel de la boutique (`}
        <LegalLink href={LEGAL.officialSiteUrl}>{LEGAL.officialSiteLabel}</LegalLink>
        {`). Les produits, prix, stocks, promotions, remises de fidélité et commandes présentés sont fictifs : aucune vente réelle n’est conclue ici et aucune commande passée sur ce site n’est traitée par la boutique. Son nom, son adresse et son numéro de téléphone sont reproduits à titre d’illustration ; pour toute demande réelle, contactez la boutique par ses propres canaux. Les visuels sont des illustrations (images générées par intelligence artificielle ou images d’espace réservé).`}
      </DemoNotice>

      <LegalSection title="Éditeur du site">
        <p>
          {`Ce site est édité à titre personnel et non professionnel par ${LEGAL.editorName}. Conformément à l’article 6-III-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, l’adresse postale de l’éditeur n’est pas rendue publique.`}
        </p>
        <p>
          Contact :{" "}
          <LegalLink href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </LegalLink>
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>{LEGAL.editorName}.</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          {`Le site est hébergé par ${LEGAL.host.name}, ${LEGAL.host.address} (`}
          <LegalLink href={LEGAL.host.url}>vercel.com</LegalLink>
          {`).`}
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          {`Le code source et la mise en page de ce site sont l’œuvre de leur auteur. Les noms, marques et logos cités (Jardin Indoor, marques des produits présentés, etc.) appartiennent à leurs propriétaires respectifs et ne sont utilisés qu’à titre d’illustration.`}
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles et cookies">
        <p>
          La façon dont ce site traite vos données, ainsi que les cookies et
          le stockage local qu’il utilise, sont détaillés dans la{" "}
          <Link
            href="/confidentialite"
            className="font-medium text-brand-green underline underline-offset-2 hover:text-copper"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Signaler un contenu">
        <p>
          {`Pour signaler un contenu ou une erreur, écrivez à `}
          <LegalLink href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </LegalLink>
          {`.`}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
