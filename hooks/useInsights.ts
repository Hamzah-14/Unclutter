import { useState, useEffect } from 'react';

export function useInsights() {
  const [suggestions, setSuggestions] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [digest, setDigest] = useState('');
  const [review, setReview] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [bannerDigest, setBannerDigest] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('focusbase_digest_date');
    if (storedDate === today) {
      const cached = localStorage.getItem('focusbase_digest_text') ?? '';
      setBannerDigest(cached);
      setDigest(cached);
    } else {
      fetch('/api/digest')
        .then(r => r.json())
        .then(data => {
          setBannerDigest(data.digest);
          setDigest(data.digest);
          localStorage.setItem('focusbase_digest_date', today);
          localStorage.setItem('focusbase_digest_text', data.digest);
        })
        .catch(() => {});
    }
  }, []);

  const handleSuggest = async () => {
    setSuggestLoading(true);
    const res = await fetch('/api/suggest');
    const data = await res.json();
    setSuggestions(data.suggestions);
    setSuggestLoading(false);
  };

  const handleReview = async () => {
    setReviewLoading(true);
    const res = await fetch('/api/review');
    const data = await res.json();
    setReview(data.review);
    setReviewLoading(false);
  };

  return {
    suggestions, suggestLoading, handleSuggest,
    digest,
    review, reviewLoading, handleReview,
    bannerDigest, setBannerDigest,
  };
}
