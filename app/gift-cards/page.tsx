'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const DENOMINATIONS = [250, 500, 1000, 2000, 5000];

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  used:     'bg-gray-100 text-gray-600',
  expired:  'bg-red-100 text-red-600',
  pending:  'bg-yellow-100 text-yellow-700',
};

export default function GiftCardsPage() {
  const { user } = useSelector((state: any) => state.auth);

  // Purchase form state
  const [amount, setAmount]               = useState<number>(500);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage]             = useState('');
  const [purchasing, setPurchasing]       = useState(false);
  const [successCard, setSuccessCard]     = useState<any>(null);

  // My cards state
  const [myCards, setMyCards]   = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError]     = useState('');

  useEffect(() => {
    if (!user) return;
    setCardsLoading(true);
    api.get('/gift-cards/my-cards')
      .then(({ data }) => setMyCards(data.giftCards || []))
      .catch(() => setCardsError('Failed to load your gift cards.'))
      .finally(() => setCardsLoading(false));
  }, [user]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error('Please fill in recipient details.');
      return;
    }
    setPurchasing(true);
    try {
      const { data } = await api.post('/gift-cards/purchase', {
        amount,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        message: message.trim(),
      });
      setSuccessCard(data.giftCard);
      setRecipientName('');
      setRecipientEmail('');
      setMessage('');
      toast.success('Gift card sent successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send gift card. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-16 px-4 text-center">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Gift Cards</h1>
        <p className="text-pink-100 text-lg max-w-xl mx-auto">
          Give the gift of beauty — let them choose their perfect glow.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left — Purchase Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Gift Card</h2>

            {successCard ? (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 rounded-3xl p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gift Card Sent!</h3>
                <p className="text-gray-500 mb-6">
                  Your {formatPrice(successCard.amount)} gift card has been sent to{' '}
                  <span className="font-semibold text-gray-700">{successCard.recipientEmail}</span>.
                </p>
                <div className="bg-white rounded-2xl p-4 mb-6 inline-block shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Gift Code</p>
                  <p className="text-2xl font-mono font-bold text-pink-600 tracking-widest">
                    {successCard.code}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessCard(null)}
                  className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  Send Another Gift Card
                </button>
              </div>
            ) : (
              <form onSubmit={handlePurchase} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                {/* Denomination selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Amount</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DENOMINATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAmount(d)}
                        className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all ${
                          amount === d
                            ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md scale-105'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                        }`}
                      >
                        {formatPrice(d)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Recipient Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="E.g. Priya Sharma"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Recipient Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Recipient Email <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="priya@example.com"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Personal Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a heartfelt note..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 resize-none transition-all"
                  />
                </div>

                {/* Summary */}
                <div className="bg-pink-50 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Total to Pay</span>
                  <span className="text-2xl font-bold text-pink-600">{formatPrice(amount)}</span>
                </div>

                <button
                  type="submit"
                  disabled={purchasing}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                >
                  {purchasing ? 'Sending...' : 'Send Gift Card 🎁'}
                </button>
              </form>
            )}
          </div>

          {/* Right — How it Works */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  icon: '💳',
                  title: 'Buy a Gift Card',
                  desc: 'Choose an amount, add a personal message, and pay securely. Takes less than a minute.',
                },
                {
                  step: '2',
                  icon: '📧',
                  title: 'Recipient Gets an Email',
                  desc: 'Your recipient instantly receives a beautiful email with their unique gift code and your personal message.',
                },
                {
                  step: '3',
                  icon: '🛍️',
                  title: 'Redeem at Checkout',
                  desc: 'They apply the code at checkout on Glowzy — balance deducted automatically. No expiry hassle for a full year.',
                },
              ].map((step) => (
                <div key={step.step} className="flex gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Step {step.step}</p>
                    <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Terms */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-5">
              <h4 className="font-semibold text-gray-700 mb-3">Gift Card Terms</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Valid for 12 months from purchase date</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Can be used on any product or subscription</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Remaining balance stays on the card</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Non-refundable and non-transferable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* My Purchased Gift Cards — logged in users only */}
        {user && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Purchased Gift Cards</h2>

            {cardsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-40" />
                ))}
              </div>
            ) : cardsError ? (
              <div className="text-center py-10 text-red-500">{cardsError}</div>
            ) : myCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-gray-500">You haven't purchased any gift cards yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCards.map((card: any) => (
                  <div
                    key={card._id}
                    className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 text-white shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-pink-200 text-xs uppercase tracking-widest mb-1">Gift Card</p>
                        <p className="text-3xl font-bold">{formatPrice(card.amount)}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[card.status] || 'bg-white/20 text-white'}`}>
                        {card.status?.charAt(0).toUpperCase() + card.status?.slice(1)}
                      </span>
                    </div>

                    <div className="bg-white/20 rounded-xl p-3 mb-4">
                      <p className="text-xs text-pink-100 mb-1">Code</p>
                      <p className="font-mono font-bold tracking-widest text-lg">{card.code}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-pink-200 text-xs">Balance</p>
                        <p className="font-semibold">{formatPrice(card.balance ?? card.amount)}</p>
                      </div>
                      <div>
                        <p className="text-pink-200 text-xs">Recipient</p>
                        <p className="font-semibold truncate">{card.recipientName || '—'}</p>
                      </div>
                      {card.expiryDate && (
                        <div className="col-span-2">
                          <p className="text-pink-200 text-xs">Expires</p>
                          <p className="font-semibold">{formatDate(card.expiryDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
