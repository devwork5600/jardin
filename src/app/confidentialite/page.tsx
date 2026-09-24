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
  title: "Politique de confidentialité — Jardin Indoor",
  alternates: { canonical: "/confidentialite" },
};

const DATA = [
  {
    title: "Compte et connexion",
    data: "adresse e-mail, nom (celui fourni par GitHub ou Google si vous choisissez ce mode de connexion), adresse IP et navigateur utilisé (enregistrés avec votre session de connexion), identifiants techniques.",
    purpose: "vous authentifier et donner accès à votre compte de démonstration.",
    basis: "exécution du service que vous demandez.",
  },
  {
    title: "Commande de démonstration",
    data: "nom, prénom, e-mail, téléphone, jour de retrait choisi, contenu de la commande.",
    purpose: "enregistrer et suivre la commande de démonstration.",
    basis: "exécution du service que vous demandez.",
  },
  {
    title: "Message de contact",
    data: "nom, e-mail, téléphone (facultatif), sujet et texte du message.",
    purpose: "répondre à votre demande.",
    basis: "votre consentement (case à cocher du formulaire).",
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <DemoNotice>
        {`Ce site est une démonstration : les comptes et commandes qui y sont créés ne servent qu’à faire fonctionner cette démonstration et ne sont transmis à aucune boutique.`}
      </DemoNotice>

      <LegalSection title="Qui traite vos données ?">
        <p>
          {`Le responsable du traitement est ${LEGAL.editorName}, éditeur de ce site à titre personnel. Contact : `}
          <LegalLink href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </LegalLink>
          {`.`}
        </p>
      </LegalSection>

      <LegalSection title="Données collectées et finalités">
        <ul className="flex list-none flex-col gap-4 p-0">
          {DATA.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border-soft bg-surface p-5"
            >
              <strong className="font-semibold text-ink">{item.title}</strong>
              <dl className="mt-2 flex flex-col gap-1 text-[14.5px]">
                <div>
                  <dt className="inline font-medium text-ink">Données : </dt>
                  <dd className="inline">{item.data}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Finalité : </dt>
                  <dd className="inline">{item.purpose}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Base légale : </dt>
                  <dd className="inline">{item.basis}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p>
          {`Votre panier n’est pas envoyé à nos serveurs tant que vous n’ouvrez pas la page du panier : il reste dans votre navigateur (voir « Cookies et stockage local »). L’attestation de majorité cochée à la connexion n’est pas enregistrée. Aucune donnée n’est vendue, cédée ou utilisée à des fins publicitaires.`}
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          {`Les données du compte, des commandes et des messages sont conservées au plus 12 mois après leur dernière utilisation, puis supprimées. Vous pouvez en demander la suppression à tout moment.`}
        </p>
      </LegalSection>

      <LegalSection title="Destinataires et transferts hors Union européenne">
        <p>Vos données sont traitées par les prestataires techniques suivants :</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>
            <strong className="font-medium text-ink">Vercel</strong> —
            hébergement du site (États-Unis).
          </li>
          <li>
            <strong className="font-medium text-ink">Neon</strong> — base de
            données PostgreSQL, hébergée sur Amazon Web Services aux
            États-Unis (région us-east-2).
          </li>
          <li>
            <strong className="font-medium text-ink">Resend</strong> — envoi de
            l’e-mail contenant votre lien de connexion (États-Unis).
          </li>
          <li>
            <strong className="font-medium text-ink">GitHub, Google</strong> —
            uniquement si vous choisissez ce mode de connexion, selon leurs
            propres politiques de confidentialité.
          </li>
        </ul>
        <p>
          {`Ces prestataires étant situés aux États-Unis, vos données peuvent être transférées hors de l’Union européenne. Ces transferts s’appuient sur les mécanismes prévus par le RGPD que ces prestataires proposent (clauses contractuelles types, cadre de protection des données UE–États-Unis).`}
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies et stockage local">
        <p>Ce site n’utilise que deux traceurs, tous deux strictement nécessaires :</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>
            <code className="rounded bg-ivory-alt px-1.5 py-0.5 text-[13px] text-ink">
              better-auth.session_token
            </code>{" "}
            {`(éventuellement préfixé « __Secure- » en HTTPS) : cookie de session, déposé uniquement une fois connecté. Il est httpOnly, SameSite=Lax et dure 7 jours.`}
          </li>
          <li>
            <code className="rounded bg-ivory-alt px-1.5 py-0.5 text-[13px] text-ink">
              jardin-cart-store
            </code>{" "}
            {`(stockage local du navigateur) : mémorise les références et quantités de votre panier. Il reste dans votre navigateur, jusqu’à la commande ou à son effacement.`}
          </li>
        </ul>
        <p>
          {`Aucun cookie publicitaire, de mesure d’audience ou de suivi n’est utilisé. Ces deux traceurs sont indispensables au service que vous demandez (rester connecté, conserver votre panier) : ils sont exemptés de consentement, c’est pourquoi aucun bandeau de consentement n’est affiché.`}
        </p>
      </LegalSection>

      <LegalSection title="Contenus tiers">
        <p>
          {`Les images d’illustration de cette démonstration sont servies par placehold.co : votre adresse IP est visible de ce service lorsque votre navigateur les charge. Les polices de caractères sont hébergées avec le site, sans requête vers Google Fonts.`}
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          {`Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition sur vos données. Pour l’exercer, écrivez à `}
          <LegalLink href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </LegalLink>
          {` ou utilisez le `}
          <Link
            href="/contact"
            className="font-medium text-brand-green underline underline-offset-2 hover:text-copper"
          >
            formulaire de contact
          </Link>
          {`. Vous pouvez aussi introduire une réclamation auprès de la CNIL (`}
          <LegalLink href="https://www.cnil.fr">cnil.fr</LegalLink>
          {`).`}
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>
          {`La vente de produits de cette boutique est interdite aux mineurs : ce site est réservé aux personnes de 18 ans révolus.`}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
