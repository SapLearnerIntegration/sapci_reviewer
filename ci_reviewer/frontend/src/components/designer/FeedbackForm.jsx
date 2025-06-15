// components/designer/FeedbackForm.jsx
import React, { useState } from 'react';
import { X, Check, Star, Send } from 'lucide-react';

const FeedbackForm = ({ jobId, onSubmit, onCancel }) => {
  // Initial feedback structure with different sections
  const initialFeedback = {
    overallQuality: { rating: 0, comments: '' },
    complianceAccuracy: { rating: 0, comments: '' },
    errorHandling: { rating: 0, comments: '' },
    securityAssessment: { rating: 0, comments: '' },
    recommendations: { rating: 0, comments: '' },
    additionalComments: ''
  };

  const [feedback, setFeedback] = useState(initialFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories and descriptions for feedback sections
  const feedbackCategories = [
    { 
      id: 'overallQuality', 
      title: 'Overall Report Quality', 
      description: 'How well did the report provide a comprehensive overview?'
    },
    { 
      id: 'complianceAccuracy', 
      title: 'Compliance Analysis Accuracy', 
      description: 'How accurate was the compliance assessment against the guidelines?'
    },
    { 
      id: 'errorHandling', 
      title: 'Error Handling Evaluation', 
      description: 'How well were error handling aspects analyzed?'
    },
    { 
      id: 'securityAssessment', 
      title: 'Security Assessment', 
      description: 'How thorough was the security evaluation?'
    },
    { 
      id: 'recommendations', 
      title: 'Recommendations Relevance', 
      description: 'How useful and relevant were the recommendations?'
    }
  ];

  // Handle rating change
  const handleRatingChange = (categoryId, rating) => {
    setFeedback({
      ...feedback,
      [categoryId]: {
        ...feedback[categoryId],
        rating
      }
    });
  };

  // Handle comment change
  const handleCommentChange = (categoryId, comments) => {
    setFeedback({
      ...feedback,
      [categoryId]: {
        ...feedback[categoryId],
        comments
      }
    });
  };

  // Handle additional comments
  const handleAdditionalComments = (comments) => {
    setFeedback({
      ...feedback,
      additionalComments: comments
    });
  };

  // Submit feedback
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare the feedback data
      const feedbackData = {
        jobId,
        submittedAt: new Date().toISOString(),
        feedback
      };
      
      // Call the onSubmit callback with the feedback data
      await onSubmit(feedbackData);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stars for ratings
  const renderStars = (categoryId, currentRating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(categoryId, star)}
            className={`p-1 focus:outline-none ${
              star <= currentRating 
                ? 'text-yellow-400' 
                : 'text-gray-500'
            }`}
          >
            <Star
              size={20}
              fill={star <= currentRating ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Provide Feedback</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-300 mb-4">
            Your feedback helps us improve the quality of integration reviews. Please rate each aspect and provide any comments.
          </p>
          
          {feedbackCategories.map((category) => (
            <div key={category.id} className="mb-6 border-b border-gray-700 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-white">{category.title}</h4>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </div>
                {renderStars(category.id, feedback[category.id].rating)}
              </div>
              
              <textarea
                placeholder="Additional comments (optional)"
                value={feedback[category.id].comments}
                onChange={(e) => handleCommentChange(category.id, e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white mt-2"
                rows={2}
              />
            </div>
          ))}
          
          <div className="mb-6">
            <h4 className="font-medium text-white mb-2">Additional Comments</h4>
            <textarea
              placeholder="Any other feedback or suggestions for improvement?"
              value={feedback.additionalComments}
              onChange={(e) => handleAdditionalComments(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              rows={4}
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !Object.values(feedback).some(item => 
              typeof item === 'object' ? item.rating > 0 : item.length > 0
            )}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              isSubmitting || !Object.values(feedback).some(item => 
                typeof item === 'object' ? item.rating > 0 : item.length > 0
              ) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send size={16} className="mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;