'use client';
import { useState, useEffect, useRef, useId } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
    setIdx(startIndex);
  }, [startIndex]);
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
          <Image src={images[idx]} alt={`Image ${idx + 1} of ${images.length}`} fill className="object-contain" />
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
// Mini product card — Frequently Bought Together & Recently Viewed carousels
// ---------------------------------------------------------------------------
function MiniProductCard({
  product,
  onAdd,
  onCardClick,
  showAddButton = true,
}: {
  product: any;
  onAdd?: (p: any) => void;
  onCardClick?: () => void;
  showAddButton?: boolean;
}) {
  const imageUrl = product.images?.[0]?.url || product.image || null;
  const listPrice = Number(product.price) || 0;
  const salePrice = product.discountPrice != null ? Number(product.discountPrice) : listPrice;
  const hasDiscount = product.discountPrice != null && listPrice > salePrice && salePrice >= 0;
  const discountPct =
    hasDiscount && listPrice > 0 ? Math.round(((listPrice - salePrice) / listPrice) * 100) : 0;

  const interactive = Boolean(onCardClick);
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `View ${product.name}` : undefined}
      onClick={interactive ? onCardClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick?.();
              }
            }
          : undefined
      }
      className={`group flex-shrink-0 w-44 select-none rounded-2xl border border-gray-200/90 bg-white shadow-sm overflow-hidden transition-all duration-300 ${
        interactive
          ? 'cursor-pointer hover:shadow-xl hover:border-pink-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2'
          : 'hover:shadow-lg hover:border-pink-200/70'
      }`}
    >
      <div className="relative aspect-[5/6] bg-gradient-to-br from-gray-50 via-white to-pink-50/40 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="176px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-90">💄</div>
        )}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
            −{discountPct}%
          </span>
        )}
        {interactive && (
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
      </div>

      <div className="p-3 pt-2.5 space-y-2 border-t border-gray-100/80 bg-white">
        {product.brand ? (
          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500 truncate">
            {product.brand}
          </p>
        ) : null}
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="text-base font-bold text-pink-600 tabular-nums">{formatPrice(salePrice)}</span>
          {hasDiscount ? (
            <span className="text-xs text-gray-400 line-through tabular-nums">{formatPrice(listPrice)}</span>
          ) : null}
        </div>

        {showAddButton && onAdd ? (
          <button
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white bg-pink-500 hover:bg-pink-600 shadow-sm ring-1 ring-black/10 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 active:scale-[0.98] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0 opacity-95"
              aria-hidden
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Add</span>
          </button>
        ) : interactive ? (
          <p className="text-center text-[11px] font-semibold text-pink-600 group-hover:text-pink-700 pt-0.5">
            View product →
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProductDetailClient({ id }: { id: string }) {
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

  const tabsBaseId = useId();

  // Frequently bought together
  const [frequentlyBought, setFrequentlyBought] = useState<any[]>([]);

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // -------------------------------------------------------------------------
  // Load product
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!id?.trim()) {
      setLoading(false);
      toast.error('Invalid product link');
      router.replace('/products');
      return;
    }

    setLoading(true);
    api
      .get(`/products/${encodeURIComponent(id.trim())}`)
      .then(({ data }) => {
        const p = data?.product;
        if (!p) throw new Error('Invalid response');
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
      .catch((err: any) => {
        toast.error(err.response?.data?.message || 'Product not found');
        router.replace('/products');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!product || !user) return;
    setWishlisted(user.wishlist?.some((w: any) => w._id === product._id || w === product._id));
  }, [user, product]);

  useEffect(() => {
    if (user?.email) setNotifyEmail(user.email);
  }, [user]);

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
    const result = await dispatch(addToCart({ itemId: p._id, itemType: 'product', quantity: 1 } as any));
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

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-600">
        <p className="text-lg font-medium text-slate-800 mb-2">Could not load this product</p>
        <p className="text-sm mb-6">You will be redirected to the shop, or go back now.</p>
        <button
          type="button"
          onClick={() => router.replace('/products')}
          className="text-indigo-600 font-semibold hover:underline"
        >
          Back to products
        </button>
      </div>
    );
  }

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
            <button
              type="button"
              disabled={!product.images?.some((img: { url?: string }) => img?.url)}
              onClick={() => {
                const urls = (product.images || [])
                  .map((img: { url?: string }) => img?.url)
                  .filter(Boolean) as string[];
                if (urls.length === 0) return;
                setLightboxImages(urls);
                setLightboxStart(Math.min(selectedImage, urls.length - 1));
              }}
              aria-label="View all product images"
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 w-full p-0 border-0 text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-100"
            >
              {product.images?.[selectedImage]?.url ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.name}
                  fill
                  className="object-cover pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">💄</div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full pointer-events-none">
                  -{discount}% OFF
                </span>
              )}
            </button>
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
            Product details: Description / Ingredients / Reviews
        ================================================================ */}
        <section className="mt-16 rounded-3xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/90 shadow-sm overflow-hidden">
          <div className="px-4 pt-6 pb-2 md:px-8 md:pt-8">
            <h2 className="text-lg font-bold text-gray-900 md:text-xl mb-1">Product details</h2>
            <p className="text-sm text-gray-500 mb-6">Everything you need to know before you buy.</p>

            <div
              role="tablist"
              aria-label="Product information sections"
              className="flex flex-wrap gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/60"
            >
              {(
                [
                  { id: 'description' as const, label: 'Description', short: 'About this item' },
                  { id: 'ingredients' as const, label: 'Ingredients', short: 'Formula & usage' },
                  {
                    id: 'reviews' as const,
                    label: 'Reviews',
                    short: 'Customer feedback',
                    count: product.numReviews ?? 0,
                  },
                ] as const
              ).map((tab) => {
                const selected = activeTab === tab.id;
                const tabId = `${tabsBaseId}-${tab.id}`;
                return (
                  <button
                    key={tab.id}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${tabsBaseId}-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none rounded-xl px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${
                      selected
                        ? 'bg-white text-pink-700 shadow-md shadow-pink-500/10 ring-1 ring-pink-200/80'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="block text-sm font-bold leading-tight">{tab.label}</span>
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">
                      {tab.id === 'reviews' ? (
                        <>
                          {tab.count} {tab.count === 1 ? 'review' : 'reviews'}
                        </>
                      ) : (
                        tab.short
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-description`}
            aria-labelledby={`${tabsBaseId}-description`}
            hidden={activeTab !== 'description'}
            className="px-4 md:px-8 pb-8 pt-2 min-h-[12rem]"
          >
            {activeTab === 'description' && (
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-5 md:p-6">
                {product.description?.trim() ? (
                  <div className="max-w-none text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line [&_a]:text-pink-600 [&_a]:underline">
                    {product.description}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    <p className="text-4xl mb-3" aria-hidden>
                      📄
                    </p>
                    <p className="text-gray-500 font-medium">No detailed description yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Check the highlights above or contact support if you have questions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-ingredients`}
            aria-labelledby={`${tabsBaseId}-ingredients`}
            hidden={activeTab !== 'ingredients'}
            className="px-4 md:px-8 pb-8 pt-2 min-h-[12rem]"
          >
            {activeTab === 'ingredients' && (
              <div className="space-y-6">
                {product.howToUse?.trim() && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 md:p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-amber-900/80 mb-2">
                      How to use
                    </h3>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {product.howToUse}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-100 bg-white/80 p-5 md:p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4">
                    Ingredients
                  </h3>
                  {product.ingredients?.trim() ? (
                    (() => {
                      const parts = product.ingredients
                        .split(/[,;\n]+/)
                        .map((s: string) => s.trim())
                        .filter(Boolean);
                      const useChips = parts.length > 1;
                      return useChips ? (
                        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                          {parts.map((item: string, i: number) => (
                            <li
                              key={`${i}-${item.slice(0, 12)}`}
                              className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-pink-50 text-pink-900/90 border border-pink-100"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {product.ingredients}
                        </p>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">
                        Ingredient information has not been provided for this product.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-reviews`}
            aria-labelledby={`${tabsBaseId}-reviews`}
            hidden={activeTab !== 'reviews'}
            className="px-4 md:px-8 pb-8 pt-2 min-h-[12rem]"
          >
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-5 md:p-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tabular-nums">
                      {typeof product.ratings === 'number' ? product.ratings.toFixed(1) : '—'}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">/ 5</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex text-yellow-400 text-lg tracking-tight" aria-hidden>
                      {'★'.repeat(Math.round(product.ratings || 0))}
                      {'☆'.repeat(5 - Math.round(product.ratings || 0))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on <span className="font-semibold text-gray-800">{product.numReviews ?? 0}</span>{' '}
                      {(product.numReviews ?? 0) === 1 ? 'rating' : 'ratings'}
                    </p>
                  </div>
                </div>

                {user && (
                  <form
                    onSubmit={handleReview}
                    className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm"
                  >
                    <h3 className="font-bold text-gray-900 mb-1">Write a review</h3>
                    <p className="text-sm text-gray-500 mb-5">Share photos and honest feedback—others will thank you.</p>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
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

                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                      placeholder="How was the texture, shade, and wear time?"
                      rows={4}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 mb-4"
                    />

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Add photos (up to 3)
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {reviewImages.map((src, i) => (
                          <div
                            key={i}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-pink-200"
                          >
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
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-2.5 rounded-full hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </button>
                  </form>
                )}

                {!user && (
                  <p className="text-sm text-center text-gray-500 bg-gray-50 rounded-2xl py-4 px-4 border border-gray-100">
                    <span className="font-medium text-gray-700">Sign in</span> to leave a review with photos.
                  </p>
                )}

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">All reviews</h3>
                  <div className="space-y-4">
                    {product.reviews?.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-12 px-4">
                        <p className="text-gray-500 font-medium">No reviews yet</p>
                        <p className="text-sm text-gray-400 mt-1">Be the first to share your experience.</p>
                      </div>
                    ) : (
                      product.reviews?.map((review: any) => (
                        <article
                          key={review._id}
                          className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center font-bold text-pink-700 text-sm"
                              aria-hidden
                            >
                              {review.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                                <span className="text-xs text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <div className="flex text-yellow-400 text-sm mt-0.5" aria-hidden>
                                {'★'.repeat(review.rating)}
                                {'☆'.repeat(5 - review.rating)}
                              </div>
                              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{review.comment}</p>

                              {review.images?.length > 0 && (
                                <div className="flex gap-2 mt-4">
                                  {review.images.slice(0, 3).map((imgSrc: string, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setLightboxImages(review.images);
                                        setLightboxStart(idx);
                                      }}
                                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-pink-400 transition-all"
                                    >
                                      <Image
                                        src={imgSrc}
                                        alt={`Review photo ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                      />
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
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================
            Frequently Bought Together
        ================================================================ */}
        {frequentlyBought.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Frequently bought together</h2>
            <p className="text-sm text-gray-500 mb-6">Pairs well with what’s in your bag.</p>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {frequentlyBought.map((p: any) => (
                <div key={p._id} className="snap-start">
                  <MiniProductCard product={p} onAdd={handleAddRelatedToCart} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            Recently Viewed
        ================================================================ */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Recently viewed</h2>
            <p className="text-sm text-gray-500 mb-6">Pick up where you left off.</p>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {recentlyViewed.map((p: any) => (
                <div key={p._id} className="snap-start">
                  <MiniProductCard
                    product={p}
                    showAddButton={false}
                    onCardClick={() => router.push(`/products/${p._id}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
