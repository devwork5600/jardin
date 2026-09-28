import { Button, Column, Row, Section, Text } from "react-email";
import { formatPrice } from "../../lib/format";

export type EmailOrderItem = { label: string; quantity: number; totalCents: number };

// Everything the order e-mails show, already resolved: no database in here.
export type OrderEmailProps = {
  baseUrl: string;
  firstName: string;
  orderNumber: string;
  items: EmailOrderItem[];
  loyaltyDiscountCents: number;
  totalCents: number;
  pickup: string; // "Mercredi 30 septembre, 10h00 – 18h40"
  address: string;
  phone: string;
  orderUrl: string;
  paidOnline: boolean;
};

export const previewOrder: OrderEmailProps = {
  baseUrl: "http://localhost:3000",
  firstName: "Camille",
  orderNumber: "FE-6QAXHJ4Y",
  items: [
    { label: "Bonsaï Ficus — 5-6 ans étage", quantity: 2, totalCents: 5198 },
    { label: "Cactus boule mix — pot D.21cm", quantity: 1, totalCents: 3499 },
    { label: "Monstera Deliciosa Philodendron — H.120 cm", quantity: 1, totalCents: 8299 },
  ],
  loyaltyDiscountCents: 848,
  totalCents: 16148,
  pickup: "Mercredi 30 septembre, 10h00 – 18h40",
  address: "12 rue du Cactus, 56000 Vannes",
  phone: "01 99 00 56 56",
  orderUrl: "http://localhost:3000/compte/commandes/FE-6QAXHJ4Y",
  paidOnline: true,
};

export function OrderSummary({ order }: { order: OrderEmailProps }) {
  return (
    <>
      <Section className="my-[20px] rounded-[14px] bg-white px-[22px] py-[18px]">
        <Text className="m-0 text-[12px] tracking-[0.12em] text-muted uppercase">
          {`Commande n° ${order.orderNumber}`}
        </Text>
        {order.items.map((item) => (
          <Row key={item.label} className="border-b border-line border-solid py-[8px]">
            <Column className="text-[14.5px]">{`${item.label} × ${item.quantity}`}</Column>
            <Column align="right" className="text-[14.5px] whitespace-nowrap">
              {formatPrice(item.totalCents)}
            </Column>
          </Row>
        ))}
        {order.loyaltyDiscountCents > 0 && (
          <Row className="pt-[8px]">
            <Column className="text-[14px] text-muted">Remise fidélité</Column>
            <Column align="right" className="text-[14px] text-muted whitespace-nowrap">
              {`− ${formatPrice(order.loyaltyDiscountCents)}`}
            </Column>
          </Row>
        )}
        <Row className="pt-[12px]">
          <Column className="text-[15px] font-bold">Total</Column>
          <Column align="right" className="text-[15px] font-bold whitespace-nowrap">
            {formatPrice(order.totalCents)}
          </Column>
        </Row>
      </Section>

      <Text className="m-0 text-[14px] leading-[22px]">
        <strong>Retrait :</strong> {order.pickup}
        <br />
        {`${order.address} · ${order.phone}`}
      </Text>
      <Section className="mt-[20px]">
        <Button
          href={order.orderUrl}
          className="rounded-[10px] bg-forest px-[24px] py-[12px] text-[13px] font-bold text-white no-underline"
        >
          Voir ma commande
        </Button>
      </Section>
    </>
  );
}
