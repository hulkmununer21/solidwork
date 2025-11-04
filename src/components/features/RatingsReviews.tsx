import { useState } from "react";
import { Star, MessageSquare, ThumbsUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const RatingsReviews = () => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      provider: "Dr. Michael Okafor",
      specialty: "Endocrinologist",
      rating: 5,
      review: "Excellent consultation! Very thorough and explained everything clearly. Highly recommend.",
      date: "2 days ago",
      helpful: 12
    },
    {
      id: 2,
      provider: "Dr. Amina Hassan",
      specialty: "General Practice",
      rating: 4,
      review: "Good experience overall. Professional and caring approach to patient care.",
      date: "1 week ago",
      helpful: 8
    }
  ];

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback! It helps others choose the right provider."
    });

    setRating(0);
    setReview("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">Reviews & Ratings</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Star className="w-4 h-4 mr-2" />
              Rate Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Recent Consultation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rate Dr. Michael Okafor</label>
                <div className="flex space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-2xl transition-colors"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= rating 
                            ? "text-yellow-400 fill-current" 
                            : "text-muted-foreground"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Write a Review (Optional)</label>
                <Textarea 
                  placeholder="Share your experience with other patients..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleSubmitReview} className="w-full">
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((reviewItem) => (
          <Card key={reviewItem.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {reviewItem.provider.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-foreground">{reviewItem.provider}</h3>
                    <Badge variant="outline">{reviewItem.specialty}</Badge>
                  </div>
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= reviewItem.rating
                            ? "text-yellow-400 fill-current"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {reviewItem.rating}/5
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3">{reviewItem.review}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {reviewItem.date}
                      </span>
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {reviewItem.helpful}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};