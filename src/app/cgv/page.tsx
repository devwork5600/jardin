import type { Metadata } from "next";
import Link from "next/link";
import {
  DemoNotice,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { SHOP_HOURS } from "@/lib/shop-hours";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Jardin Indoor",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales de vente">
      <DemoNotice>
        {`Ces conditions illustrent le fonctionnement prévu d’un e-drive (commande en ligne, retrait en boutique). Aucune vente réelle n’est conclue via ce site : elles n’ont aucune valeur contractuelle et ne constituent pas un conseil juridique.`}
      </DemoNotice>

      <LegalSection title="1. Objet">
        <p>
          {`Les présentes conditions régissent les commandes passées sur ce site pour un retrait en boutique (« e-drive »).`}
        </p>
      </LegalSection>

      <LegalSection title="2. Produits et prix">
        <p>
          {`Les prix sont indiqués en euros toutes taxes comprises. Les prix, promotions et remises de fidélité affichés sont réservés aux commandes passées en ligne avec un compte. Il n’y a aucun frais de livraison : le retrait est gratuit. Les photographies ne sont pas contractuelles. Le stock est vérifié à la validation de la commande.`}
        </p>
      </LegalSection>

      <LegalSection title="3. Compte et majorité">
        <p>
          {`La commande est réservée aux personnes majeures : la vente est interdite aux mineurs. Le compte se crée en se connectant par lien reçu par e-mail ou via GitHub ou Google, en certifiant avoir plus de 18 ans et en acceptant les présentes conditions.`}
        </p>
      </LegalSection>

      <LegalSection title="4. Commande">
        <p>
          {`La commande est enregistrée à sa validation et confirmée par une page de confirmation portant un numéro de commande. Elle passe ensuite par les statuts « en préparation », « prête au retrait » puis « retirée ». Une commande peut être annulée en cas d’indisponibilité d’un article.`}
        </p>
      </LegalSection>

      <LegalSection title="5. Retrait en boutique">
        <p>
          {`Le retrait se fait à la boutique, 36 avenue Gontran Bienvenu, 56000 Vannes, le jour choisi lors de la commande, au plus tôt le lendemain. Horaires d’ouverture :`}
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-1">
          {SHOP_HOURS.map((hours) => (
            <li key={hours.day}>
              {hours.day} : {hours.time}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="6. Paiement">
        <p>
          {`Le paiement s’effectue au retrait, par carte bancaire ou en espèces. Le paiement par carte en ligne n’est pas encore disponible. Les chèques ne sont pas acceptés.`}
        </p>
      </LegalSection>

      <LegalSection title="7. Programme de fidélité">
        <p>
          {`Une remise est accordée selon un palier de dépenses cumulées. Elle n’est pas cumulable avec les promotions en cours : elle s’applique aux seuls articles qui ne sont pas déjà en promotion. Le palier et le taux applicables figurent dans le récapitulatif de la commande ; ceux de cette démonstration sont indicatifs.`}
        </p>
      </LegalSection>

      <LegalSection title="8. Droit de rétractation">
        <p>
          {`Pour une vente à distance, le consommateur dispose en principe d’un délai de 14 jours pour se rétracter (article L221-18 du Code de la consommation), sauf exceptions prévues par la loi, notamment pour certains biens qui ne peuvent être renvoyés pour des raisons d’hygiène ou de protection de la santé une fois descellés. Dans une exploitation réelle, les modalités précises seraient détaillées ici.`}
        </p>
      </LegalSection>

      <LegalSection title="9. Garanties légales">
        <p>
          {`Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).`}
        </p>
      </LegalSection>

      <LegalSection title="10. Données personnelles">
        <p>
          {`Le traitement des données personnelles est décrit dans la `}
          <Link
            href="/confidentialite"
            className="font-medium text-brand-green underline underline-offset-2 hover:text-copper"
          >
            politique de confidentialité
          </Link>
          {`.`}
        </p>
      </LegalSection>

      <LegalSection title="11. Médiation et droit applicable">
        <p>
          {`Le droit français est applicable. En cas de litige, le consommateur peut recourir gratuitement à un médiateur de la consommation (articles L611-1 et suivants du Code de la consommation). Aucune vente réelle n’étant conclue via cette démonstration, aucun médiateur n’est désigné.`}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
