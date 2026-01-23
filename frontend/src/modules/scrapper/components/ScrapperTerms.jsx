import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperTerms = () => {
  const staticTexts = [
    'SCRAPTO – SCRAPPER PARTNER AGREEMENT',
    'Last Updated: 01 January 2026',
    'This Agreement is between Scrapto and the Scrapper Partner.',
    'Nature of Relationship',
    'Scrappers are independent contractors',
    'This agreement does not create employment, agency, or partnership',
    'Scrapto is a technology service provider only',
    'Scope of Services',
    'Scrapper agrees to:',
    'Collect scrap directly from users',
    'Provide fair pricing',
    'Complete pickups within committed time',
    'Follow ethical business practices',
    'Subscription & Fees',
    'Subscription fees provide access to platform features and leads',
    'Fees are non-refundable',
    'Subscription does not guarantee earnings or lead volume',
    'Pricing & Negotiation',
    'Scrappers may negotiate prices directly with users',
    'Scrapto does not interfere in price decisions',
    'Any price dispute is solely scrapper’s responsibility',
    'Payment to Users',
    'Scrapper must pay users directly at pickup',
    'Scrapto is not responsible for payment defaults',
    'Non-payment may lead to immediate suspension',
    'Pickup Obligations',
    'Missed pickups result in lead forfeiture',
    'Repeated misses may cause suspension or termination',
    'Scrapper must update pickup status honestly',
    'Area Exclusivity',
    'Area exclusivity is preferential access, not guaranteed income',
    'Scrapto may revoke exclusivity for misconduct or SLA failure',
    'Ratings & Conduct',
    'Scrappers must maintain professional behavior',
    'Harassment, threats, or misrepresentation = permanent ban',
    'Scrapto may remove fake or abusive ratings',
    'Legal & Regulatory Compliance',
    'Scrapper is solely responsible for:',
    'Environmental laws',
    'Waste handling regulations',
    'Transport permits',
    'Labor compliance',
    'Safety standards',
    'Scrapper indemnifies Scrapto from all penalties and claims.',
    'Dispute Resolution',
    'Scrapto may mediate disputes at its discretion.',
    "Scrapto’s decision shall be final and binding.",
    'Termination',
    'Scrapto may terminate this agreement without notice for:',
    'Fraud',
    'Repeated disputes',
    'Platform abuse',
    'Legal non-compliance',
    'Limitation of Liability',
    "Scrapto’s total liability shall not exceed subscription fees paid in the last 30 days.",
    'Governing Law',
    'Indian law applies.',
    'Jurisdiction: Ghaziabad, Uttar Pradesh.'
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}
    >
      <div className="w-full p-4 md:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-3 md:pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <IoArrowBack size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {getTranslatedText('SCRAPTO – SCRAPPER PARTNER AGREEMENT')}
            </h1>
          </div>
          <div className="text-sm text-white/80 hidden md:block">{getTranslatedText('Last Updated: 01 January 2026')}</div>
        </div>

        <div className="rounded-2xl p-4 md:p-6 shadow-lg backdrop-blur-sm bg-white/95">
          <div className="prose max-w-none text-sm md:text-base text-slate-700">
            <p>{getTranslatedText('This Agreement is between Scrapto and the Scrapper Partner.')}</p>

            <h3>{getTranslatedText('1. Nature of Relationship')}</h3>
            <ul>
              <li>{getTranslatedText('Scrappers are independent contractors')}</li>
              <li>{getTranslatedText('This agreement does not create employment, agency, or partnership')}</li>
              <li>{getTranslatedText('Scrapto is a technology service provider only')}</li>
            </ul>

            <h3>{getTranslatedText('2. Scope of Services')}</h3>
            <p>{getTranslatedText('Scrapper agrees to:')}</p>
            <ul>
              <li>{getTranslatedText('Collect scrap directly from users')}</li>
              <li>{getTranslatedText('Provide fair pricing')}</li>
              <li>{getTranslatedText('Complete pickups within committed time')}</li>
              <li>{getTranslatedText('Follow ethical business practices')}</li>
            </ul>

            <h3>{getTranslatedText('3. Subscription & Fees')}</h3>
            <ul>
              <li>{getTranslatedText('Subscription fees provide access to platform features and leads')}</li>
              <li>{getTranslatedText('Fees are non-refundable')}</li>
              <li>{getTranslatedText('Subscription does not guarantee earnings or lead volume')}</li>
            </ul>

            <h3>{getTranslatedText('4. Pricing & Negotiation')}</h3>
            <ul>
              <li>{getTranslatedText('Scrappers may negotiate prices directly with users')}</li>
              <li>{getTranslatedText('Scrapto does not interfere in price decisions')}</li>
              <li>{getTranslatedText('Any price dispute is solely scrapper’s responsibility')}</li>
            </ul>

            <h3>{getTranslatedText('5. Payment to Users')}</h3>
            <ul>
              <li>{getTranslatedText('Scrapper must pay users directly at pickup')}</li>
              <li>{getTranslatedText('Scrapto is not responsible for payment defaults')}</li>
              <li>{getTranslatedText('Non-payment may lead to immediate suspension')}</li>
            </ul>

            <h3>{getTranslatedText('6. Pickup Obligations')}</h3>
            <ul>
              <li>{getTranslatedText('Missed pickups result in lead forfeiture')}</li>
              <li>{getTranslatedText('Repeated misses may cause suspension or termination')}</li>
              <li>{getTranslatedText('Scrapper must update pickup status honestly')}</li>
            </ul>

            <h3>{getTranslatedText('7. Area Exclusivity')}</h3>
            <ul>
              <li>{getTranslatedText('Area exclusivity is preferential access, not guaranteed income')}</li>
              <li>{getTranslatedText('Scrapto may revoke exclusivity for misconduct or SLA failure')}</li>
            </ul>

            <h3>{getTranslatedText('8. Ratings & Conduct')}</h3>
            <ul>
              <li>{getTranslatedText('Scrappers must maintain professional behavior')}</li>
              <li>{getTranslatedText('Harassment, threats, or misrepresentation = permanent ban')}</li>
              <li>{getTranslatedText('Scrapto may remove fake or abusive ratings')}</li>
            </ul>

            <h3>{getTranslatedText('9. Legal & Regulatory Compliance')}</h3>
            <p>{getTranslatedText('Scrapper is solely responsible for:')}</p>
            <ul>
              <li>{getTranslatedText('Environmental laws')}</li>
              <li>{getTranslatedText('Waste handling regulations')}</li>
              <li>{getTranslatedText('Transport permits')}</li>
              <li>{getTranslatedText('Labor compliance')}</li>
              <li>{getTranslatedText('Safety standards')}</li>
            </ul>
            <p>{getTranslatedText('Scrapper indemnifies Scrapto from all penalties and claims.')}</p>

            <h3>{getTranslatedText('10. Dispute Resolution')}</h3>
            <p>{getTranslatedText('Scrapto may mediate disputes at its discretion.')}</p>
            <p>{getTranslatedText("Scrapto’s decision shall be final and binding.")}</p>

            <h3>{getTranslatedText('11. Termination')}</h3>
            <p>{getTranslatedText('Scrapto may terminate this agreement without notice for:')}</p>
            <ul>
              <li>{getTranslatedText('Fraud')}</li>
              <li>{getTranslatedText('Repeated disputes')}</li>
              <li>{getTranslatedText('Platform abuse')}</li>
              <li>{getTranslatedText('Legal non-compliance')}</li>
            </ul>

            <h3>{getTranslatedText('12. Limitation of Liability')}</h3>
            <p>{getTranslatedText("Scrapto’s total liability shall not exceed subscription fees paid in the last 30 days.")}</p>

            <h3>{getTranslatedText('13. Governing Law')}</h3>
            <p>{getTranslatedText('Indian law applies.')}</p>
            <p>{getTranslatedText('Jurisdiction: Ghaziabad, Uttar Pradesh.')}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScrapperTerms;
