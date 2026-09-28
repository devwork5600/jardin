import { Text } from "react-email";
import { formatPrice } from "../lib/format";
import { EmailLayout, emailHeadingStyle } from "./components/email-layout";
import { OrderSummary, previewOrder, type OrderEmailProps } from "./components/order-summary";

export function OrderReadyEmail(order: OrderEmailProps) {
  return (
    <EmailLayout preview={`Votre commande ${order.orderNumber} est prête`} baseUrl={order.baseUrl}>
      <Text className="mt-[24px] mb-[8px] text-[28px] leading-[34px]" style={emailHeadingStyle}>
        Votre commande est prête
      </Text>
      <Text className="m-0 text-[15px] leading-[24px]">
        {`Bonjour ${order.firstName}, vous pouvez venir la récupérer en boutique.`}
      </Text>
      <Text className="mt-[12px] mb-0 text-[14.5px] leading-[22px]">
        {order.paidOnline
          ? "Déjà réglée en ligne : rien à payer sur place."
          : `À régler sur place : ${formatPrice(order.totalCents)}, par carte ou en espèces.`}
      </Text>
      <OrderSummary order={order} />
    </EmailLayout>
  );
}

OrderReadyEmail.PreviewProps = { ...previewOrder, paidOnline: false } satisfies OrderEmailProps;

export default OrderReadyEmail;
