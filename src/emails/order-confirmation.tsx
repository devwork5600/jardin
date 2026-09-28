import { Text } from "react-email";
import { EmailLayout, emailHeadingStyle } from "./components/email-layout";
import { OrderSummary, previewOrder, type OrderEmailProps } from "./components/order-summary";

export function OrderConfirmationEmail(order: OrderEmailProps) {
  const payment = order.paidOnline
    ? "Votre paiement par carte est confirmé."
    : "Vous réglerez au retrait, par carte ou en espèces.";

  return (
    <EmailLayout preview={`Commande ${order.orderNumber} confirmée`} baseUrl={order.baseUrl}>
      <Text className="mt-[24px] mb-[8px] text-[28px] leading-[34px]" style={emailHeadingStyle}>
        Merci pour votre commande
      </Text>
      <Text className="m-0 text-[15px] leading-[24px]">
        {`Bonjour ${order.firstName}, votre commande est bien enregistrée et en cours de préparation. ${payment}`}
      </Text>
      <OrderSummary order={order} />
    </EmailLayout>
  );
}

OrderConfirmationEmail.PreviewProps = previewOrder satisfies OrderEmailProps;

export default OrderConfirmationEmail;
