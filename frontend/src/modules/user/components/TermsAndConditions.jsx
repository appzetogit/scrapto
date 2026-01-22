import { motion } from "framer-motion";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const TermsAndConditions = () => {
  const staticTexts = [
    "Scrapto – User Terms & Conditions",
    "Last Updated: 01 January 2026",
    "Introduction",
    "Scrapto (“Platform”, “We”, “Us”) is a technology platform that connects users with independent scrap collectors (“Scrappers”) for scrap material collection services.",
    "By using Scrapto, you agree to these Terms & Conditions.",
    "Scrapto’s Role",
    "Scrapto is only a facilitator and does not:",
    "Purchase or sell scrap",
    "Handle payments",
    "Transport or store scrap material",
    "Guarantee prices or service quality",
    "All scrap transactions occur directly between the user and the scrapper.",
    "Scrap Pricing",
    "Prices shown are indicative market rates only",
    "Final prices depend on:",
    "Material condition",
    "Weight",
    "Contamination",
    "Market fluctuations",
    "Scrapto does not guarantee final prices",
    "Weighing & Measurement",
    "Weight is measured using the scrapper’s equipment",
    "User must be present during weighing",
    "No disputes accepted after pickup completion",
    "Payment Terms",
    "Payments are made directly by the scrapper to the user",
    "Scrapto does not collect or hold payments",
    "Scrapto is not liable for payment disputes",
    "Pickup & Cancellation",
    "Pickup times are indicative",
    "Scrapto is not responsible for delays caused by scrappers",
    "Users may cancel bookings anytime before pickup",
    "Fake or abusive bookings may result in account suspension.",
    "Ratings & Reviews",
    "Users may rate scrappers based on experience",
    "False, abusive, or manipulated reviews may be removed",
    "Scrapto’s decision on reviews is final",
    "Dispute Resolution",
    "Scrapto may mediate disputes related to:",
    "Missed pickups",
    "Misconduct",
    "Platform misuse",
    "Scrapto will not mediate:",
    "Price disagreements",
    "Scrap quality issues",
    "Cash disputes",
    "Account Suspension",
    "Scrapto may suspend or terminate accounts for:",
    "Fraud",
    "Abuse",
    "Repeated disputes",
    "Platform misuse",
    "Limitation of Liability",
    "Scrapto’s total liability, if any, shall not exceed ₹1,000 or the last service fee paid, whichever is lower.",
    "Governing Law",
    "These terms are governed by Indian law.",
    "Jurisdiction: Courts of that particular district only.",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen w-full"
      style={{ backgroundColor: "#f4ebe2" }}>
      <div className="w-full p-4 md:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-3 md:pb-6">
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#2d3748" }}>
            {getTranslatedText("Scrapto – User Terms & Conditions")}
          </h1>
          <div className="text-sm text-gray-500">{getTranslatedText("Last Updated: 01 January 2026")}</div>
        </div>

        <div className="rounded-2xl p-4 md:p-6 shadow" style={{ backgroundColor: "#ffffff" }}>
          <div className="prose max-w-none text-sm md:text-base" style={{ color: "#334155" }}>
            <h3>{getTranslatedText("Introduction")}</h3>
            <p>{getTranslatedText("Scrapto (“Platform”, “We”, “Us”) is a technology platform that connects users with independent scrap collectors (“Scrappers”) for scrap material collection services.")}</p>
            <p>{getTranslatedText("By using Scrapto, you agree to these Terms & Conditions.")}</p>

            <h3>{getTranslatedText("Scrapto’s Role")}</h3>
            <p>{getTranslatedText("Scrapto is only a facilitator and does not:")}</p>
            <ul>
              <li>{getTranslatedText("Purchase or sell scrap")}</li>
              <li>{getTranslatedText("Handle payments")}</li>
              <li>{getTranslatedText("Transport or store scrap material")}</li>
              <li>{getTranslatedText("Guarantee prices or service quality")}</li>
            </ul>
            <p>{getTranslatedText("All scrap transactions occur directly between the user and the scrapper.")}</p>

            <h3>{getTranslatedText("Scrap Pricing")}</h3>
            <p>{getTranslatedText("Prices shown are indicative market rates only")}</p>
            <p>{getTranslatedText("Final prices depend on:")}</p>
            <ul>
              <li>{getTranslatedText("Material condition")}</li>
              <li>{getTranslatedText("Weight")}</li>
              <li>{getTranslatedText("Contamination")}</li>
              <li>{getTranslatedText("Market fluctuations")}</li>
            </ul>
            <p>{getTranslatedText("Scrapto does not guarantee final prices")}</p>

            <h3>{getTranslatedText("Weighing & Measurement")}</h3>
            <ul>
              <li>{getTranslatedText("Weight is measured using the scrapper’s equipment")}</li>
              <li>{getTranslatedText("User must be present during weighing")}</li>
              <li>{getTranslatedText("No disputes accepted after pickup completion")}</li>
            </ul>

            <h3>{getTranslatedText("Payment Terms")}</h3>
            <ul>
              <li>{getTranslatedText("Payments are made directly by the scrapper to the user")}</li>
              <li>{getTranslatedText("Scrapto does not collect or hold payments")}</li>
              <li>{getTranslatedText("Scrapto is not liable for payment disputes")}</li>
            </ul>

            <h3>{getTranslatedText("Pickup & Cancellation")}</h3>
            <ul>
              <li>{getTranslatedText("Pickup times are indicative")}</li>
              <li>{getTranslatedText("Scrapto is not responsible for delays caused by scrappers")}</li>
              <li>{getTranslatedText("Users may cancel bookings anytime before pickup")}</li>
              <li>{getTranslatedText("Fake or abusive bookings may result in account suspension.")}</li>
            </ul>

            <h3>{getTranslatedText("Ratings & Reviews")}</h3>
            <ul>
              <li>{getTranslatedText("Users may rate scrappers based on experience")}</li>
              <li>{getTranslatedText("False, abusive, or manipulated reviews may be removed")}</li>
              <li>{getTranslatedText("Scrapto’s decision on reviews is final")}</li>
            </ul>

            <h3>{getTranslatedText("Dispute Resolution")}</h3>
            <p>{getTranslatedText("Scrapto may mediate disputes related to:")}</p>
            <ul>
              <li>{getTranslatedText("Missed pickups")}</li>
              <li>{getTranslatedText("Misconduct")}</li>
              <li>{getTranslatedText("Platform misuse")}</li>
            </ul>
            <p>{getTranslatedText("Scrapto will not mediate:")}</p>
            <ul>
              <li>{getTranslatedText("Price disagreements")}</li>
              <li>{getTranslatedText("Scrap quality issues")}</li>
              <li>{getTranslatedText("Cash disputes")}</li>
            </ul>

            <h3>{getTranslatedText("Account Suspension")}</h3>
            <p>{getTranslatedText("Scrapto may suspend or terminate accounts for:")}</p>
            <ul>
              <li>{getTranslatedText("Fraud")}</li>
              <li>{getTranslatedText("Abuse")}</li>
              <li>{getTranslatedText("Repeated disputes")}</li>
              <li>{getTranslatedText("Platform misuse")}</li>
            </ul>

            <h3>{getTranslatedText("Limitation of Liability")}</h3>
            <p>{getTranslatedText("Scrapto’s total liability, if any, shall not exceed ₹1,000 or the last service fee paid, whichever is lower.")}</p>

            <h3>{getTranslatedText("Governing Law")}</h3>
            <p>{getTranslatedText("These terms are governed by Indian law.")}</p>
            <p>{getTranslatedText("Jurisdiction: Courts of that particular district only.")}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;
