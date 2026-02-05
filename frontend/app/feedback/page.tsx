'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit feedback logic here
    console.log({ rating, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-6">Your feedback helps us improve future events.</p>
          <Link href="/" className="text-orange-600 hover:text-orange-500 font-medium">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-center">Event Feedback</h1>
        <p className="text-gray-500 text-center mb-8">How was &quot;Annual Tech Hackathon&quot;?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-500 mb-4">Rate your experience</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    rating >= star ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="What did you like? What could be better?"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              rating > 0 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
