'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Lightbox modal for review images
// ---------------------------------------------------------------------------
function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-3xl font-bold leading-none hover:text-pink-300 transition-colors"
        >
          ×
        </button>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-black">
          <Image src={images[idx]} alt={`Review image ${idx + 1}`} fill className="object-contain" />
        </div>
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="text-white bg-white/20 hover:bg-white/40 rounded-full w-9 h-9 flex items-center justify-center text-lg transition-colors"
            >
              ‹
            </button>
            <span className="text-white text-sm">{idx + 1} / {images.length}</span>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="text-white bg-white/20 hover:bg-white/40 rounded-full w-9 h-9 flex items-center justify-center text-lg transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini product card used in Frequently Bought Together & Recently Viewed
// ---------------------------------------------------------------------------
function MiniProductCard({ product, onAdd }: { product: any; onAdd: (p: any) => void }) {
  const imageUrl = product.images?.[0]?.url || product.image || null;
  const price = product.discountPrice || product.price;
  return (
    <div className="flex-shrink-0 w-40 border rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="relative h-36 bg-gray-50">
        {imageUrl ? (
          <Image src={imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">💄</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{product.name}</p>
        <p className="text-pink-600 font-bold text-sm mb-2">{formatPrice(price)}</p>
        <button
          onClick={() => onAdd(product)}
          className="w-full text-xs bg-pink-500 hover:bg-pink-600 text-white font-semibold py-1.5 rounded-full transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.auth);

  // Core product state
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'reviews'>('description');
  const [wishlisted, setWishlisted] = useState(false);

  // Variant selector
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Back-in-stock alert
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Review form
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]); // base64 strings
  const reviewFileRef = useRef<HTMLInputElement>(null);

  // Review lightbox
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxStart, setLightboxStart] = useState(0);

  // Frequently bought together
  const [frequentlyBought, setFrequentlyBought] = useState<any[]>([]);

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // -------------------------------------------------------------------------
  // Load product
  // -------------------------------------------------------------------------
  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.product;
        setProduct(p);
        if (user) {
          setWishlisted(user.wishlist?.some((w: any) => w._id === p._id || w === p._id));
        }
        setNotifyEmail(user?.email || '');

        // Persist to recently-viewed localStorage
        try {
          const stored = localStorage.getItem('recentlyViewed');
          const list: any[] = stored ? JSON.parse(stored) : [];
          // Build a compact snapshot of the product
          const snapshot = {
            _id: p._id,
            name: p.name,
            price: p.price,
            discountPrice: p.discountPrice,
            slug: p.slug,
            image: p.images?.[0]?.url || null,
          };
          const deduped = [snapshot, ...list.filter((x) => x._id !== p._id)].slice(0, 6);
          localStorage.setItem('recentlyViewed', JSON.stringify(deduped));
          // Show all except current product
          setRecentlyViewed(deduped.filter((x) => x._id !== p._id));
        } catch {
          // localStorage unavailable — silently skip
        }
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  // -------------------------------------------------------------------------
  // Load frequently bought together after product loads
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!product) return;

    if (product.frequentlyBoughtWith?.length > 0) {
      // Already populated by API
      setFrequentlyBought(product.frequentlyBoughtWith.filter((p: any) => p._id !== product._id).slice(0, 3));
      return;
    }

    // Fallback: fetch by category
    if (!product.category) return;
    api.get(`/products?category=${product.category}&limit=4`)
      .then(({ data }) => {
        const items: any[] = (data.products || data.data || [])
          .filter((p: any) => p._id !== product._id)
          .slice(0, 3);
        setFrequentlyBought(items);
      })
      .catch(() => {/* non-critical */});
  }, [product]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const basePrice = product?.discountPrice || product?.price || 0;
  const variantPriceModifier = selectedVariant?.priceModifier || 0;
  const displayPrice = basePrice + variantPriceModifier;

  const effectiveStock = selectedVariant != null
    ? (selectedVariant.stock ?? product?.stock ?? 0)
    : (product?.stock ?? 0);

  const isOutOfStock = effectiveStock === 0;

  const discount = product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleAddToCart = async () => {
    if (!user) { router.push('/auth/login'); return; }
    const payload: any = { itemId: product._id, itemType: 'product', quantity };
    if (selectedVariant?._id) payload.variantId = selectedVariant._id;
    const result = await dispatch(addToCart(payload));
    if (addToCart.fulfilled.match(result)) toast.success('Added to cart!');
    else toast.error((result.payload as string) || 'Failed to add');
  };

  const handleAddRelatedToCart = async (p: any) => {
    if (!user) { router.push('/auth/login'); return; }
    const result = await dispatch(addToCart({ itemId: p._id, itemType: 'product', quantity: 1 }));
    if (addToCart.fulfilled.match(result)) toast.success(`${p.name} added to cart!`);
    else toast.error((result.payload as string) || 'Failed to add');
  };

  const handleWishlist = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      const { data } = await api.put(`/products/${product._id}/wishlist`);
      setWishlisted(data.added);
      toast.success(data.added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifySubmitting(true);
    try {
      await api.post(`/back-in-stock/${product._id}/subscribe`, { email: notifyEmail });
      setNotifySuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not subscribe. Please try again.');
    } finally {
      setNotifySubmitting(false);
    }
  };

  const handleReviewImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - reviewImages.length;
    const toProcess = files.slice(0, remaining);
    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        setReviewImages((prev) => [...prev, b64].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
    // Reset file input so same file can be re-selected if removed
    if (reviewFileRef.current) reviewFileRef.current.value = '';
  };

  const handleReviewImageRemove = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product._id}/reviews`, {
        ...reviewForm,
        images: reviewImages,
      });
      toast.success('Review submitted!');
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setReviewForm({ rating: 5, comment: '' });
      setReviewImages([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12 animate-pulse">
        <div className="bg-gray-200 rounded-2xl aspect-square" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Lightbox */}
      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxStart}
          onClose={() => setLightboxImages(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ================================================================
            Top grid: image gallery + product info
        ================================================================ */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
              {product.images?.[selectedImage]?.url ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">💄</div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full">
                  -{discount}% OFF
                </span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-pink-500' : 'border-gray-200'
                    }`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-pink-500 font-semibold text-sm mb-1">{product.brand}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {/* ── Variant Selector ────────────────────────────────────────── */}
            {product.variants?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Select {product.variants[0]?.name || 'Variant'}:
                  {selectedVariant && (
                    <span className="ml-2 font-normal text-pink-600">{selectedVariant.value}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => {
                    const isSelected = selectedVariant?._id === variant._id;
                    const outOfStock = (variant.stock ?? 1) === 0;
                    return (
                      <button
                        key={variant._id}
                        onClick={() => setSelectedVariant(isSelected ? null : variant)}
                        disabled={outOfStock}
                        title={outOfStock ? 'Out of stock' : variant.value}
                        className={`px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-all
                          ${isSelected
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : outOfStock
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                            : 'border-gray-300 hover:border-pink-300 text-gray-700'
                          }`}
                      >
                        {variant.value}
                        {outOfStock && !isSelected ? '' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ratings + Stock badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex text-yellow-400">
                {'★'.repeat(Math.round(product.ratings))}
                {'☆'.repeat(5 - Math.round(product.ratings))}
              </div>
              <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  !isOutOfStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {!isOutOfStock ? `In Stock (${effectiveStock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900">{formatPrice(displayPrice)}</span>
              {product.discountPrice && (
                <span className="text-xl text-gray-400 line-through">{formatPrice(product.price + variantPriceModifier)}</span>
              )}
              {discount > 0 && (
                <span className="text-green-600 font-semibold">
                  Save {formatPrice(product.price - product.discountPrice)}
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {product.shortDescription || product.description?.slice(0, 200)}
            </p>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="bg-pink-50 text-pink-600 text-xs px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Add to Cart / Back-in-Stock Alert ───────────────────────── */}
            {!isOutOfStock ? (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border rounded-full overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-lg hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                    className="px-4 py-2 text-lg hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlist}
                  className={`p-3 rounded-full border-2 transition-all ${
                    wishlisted
                      ? 'border-pink-500 bg-pink-50 text-pink-500'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  {wishlisted ? '❤️' : '🤍'}
                </button>
              </div>
            ) : (
              /* Back-in-Stock form */
              <div className="mb-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                {notifySuccess ? (
                  <div className="flex items-center gap-3 text-green-700 font-semibold">
                    <span className="text-2xl">✓</span>
                    <span>We'll notify you when this product is back in stock!</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-rose-700 mb-3">
                      This item is currently out of stock. Get notified when it's available!
                    </p>
                    <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 border border-rose-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={notifySubmitting}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {notifySubmitting ? 'Submitting…' : '🔔 Notify Me'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* Perks bar */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl text-center text-sm">
              <div>
                <div className="text-xl mb-1">🚚</div>
                <div className="text-gray-600">Free delivery above ₹500</div>
              </div>
              <div>
                <div className="text-xl mb-1">↩️</div>
                <div className="text-gray-600">7-day easy returns</div>
              </div>
              <div>
                <div className="text-xl mb-1">💯</div>
                <div className="text-gray-600">100% authentic</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            Tabs: Description / Ingredients / Reviews
        ================================================================ */}
        <div className="mt-16">
          <div className="border-b flex gap-8 mb-8">
            {(['description', 'ingredients', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'reviews' && `(${product.numReviews})`}
              </button>
            ))}
          </div>

          {/* Description tab */}
          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* Ingredients tab */}
          {activeTab === 'ingredients' && (
            <div className="text-gray-600 leading-relaxed">
              {product.ingredients ? (
                <div>
                  {product.howToUse && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">How to Use</h3>
                      <p className="whitespace-pre-line">{product.howToUse}</p>
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                  <p>{product.ingredients}</p>
                </div>
              ) : (
                <p className="text-gray-400">Ingredient information not available.</p>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div>
              {/* Write a review form */}
              {user && (
                <form onSubmit={handleReview} className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>

                  {/* Star rating */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-2 block">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                          className={`text-3xl transition-transform hover:scale-110 ${
                            star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    required
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 mb-4"
                  />

                  {/* Image upload slots */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-2 block">
                      Add Photos (up to 3)
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {reviewImages.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-pink-300">
                          <Image src={src} alt={`Upload ${i + 1}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => handleReviewImageRemove(i)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-black/80 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {reviewImages.length < 3 && (
                        <button
                          type="button"
                          onClick={() => reviewFileRef.current?.click()}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-400 flex items-center justify-center text-2xl text-gray-400 hover:text-pink-400 transition-colors"
                        >
                          +
                        </button>
                      )}
                      <input
                        ref={reviewFileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewImageAdd}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-pink-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Review list */}
              <div className="space-y-6">
                {product.reviews?.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  product.reviews?.map((review: any) => (
                    <div key={review._id} className="border-b pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                          {review.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{review.name}</p>
                          <div className="flex text-yellow-400 text-xs">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm ml-12">{review.comment}</p>

                      {/* ── Review photo thumbnails ─────────────────────── */}
                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-3 ml-12">
                          {review.images.slice(0, 3).map((imgSrc: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setLightboxImages(review.images);
                                setLightboxStart(idx);
                              }}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-pink-400 transition-all"
                            >
                              <Image src={imgSrc} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
                              {idx === 2 && review.images.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                  +{review.images.length - 3}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            Frequently Bought Together
        ================================================================ */}
        {frequentlyBought.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {frequentlyBought.map((p: any) => (
                <MiniProductCard key={p._id} product={p} onAdd={handleAddRelatedToCart} />
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            Recently Viewed
        ================================================================ */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentlyViewed.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => router.push(`/products/${p._id}`)}
                  className="flex-shrink-0 w-40 border rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative h-36 bg-gray-50">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">💄</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{p.name}</p>
                    <p className="text-pink-600 font-bold text-sm">{formatPrice(p.discountPrice || p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
