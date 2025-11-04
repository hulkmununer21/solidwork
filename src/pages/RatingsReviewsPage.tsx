import { useState } from "react";
import { ArrowLeft, Star, Filter, Search, MessageSquare, ThumbsUp, Calendar, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const RatingsReviewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");

  // Enhanced mock data
  const reviews = [
    {
      id: 1,
      provider: "Dr. Michael Okafor",
      specialty: "Endocrinologist",
      rating: 5,
      review: "Exceptional care and professionalism. Dr. Okafor took time to explain my condition thoroughly and provided a comprehensive treatment plan. The virtual consultation was seamless and I felt genuinely cared for.",
      date: "2 days ago",
      helpful: 24,
      verified: true,
      consultation: "Diabetes Management",
      tags: ["Professional", "Thorough", "Caring"]
    },
    {
      id: 2,
      provider: "Dr. Amina Hassan",
      specialty: "General Practice",
      rating: 4,
      review: "Very knowledgeable and patient. She listened to all my concerns and provided practical advice. The appointment was on time and well-organized. Would recommend to others.",
      date: "5 days ago",
      helpful: 18,
      verified: true,
      consultation: "General Checkup",
      tags: ["Punctual", "Knowledgeable", "Patient"]
    },
    {
      id: 3,
      provider: "Dr. Kemi Adebayo",
      specialty: "Cardiologist", 
      rating: 5,
      review: "Outstanding specialist! Dr. Adebayo's expertise in cardiology is evident. She explained complex heart conditions in simple terms and made me feel at ease about my treatment plan.",
      date: "1 week ago",
      helpful: 31,
      verified: true,
      consultation: "Heart Health Assessment",
      tags: ["Expert", "Clear Communication", "Reassuring"]
    },
    {
      id: 4,
      provider: "Dr. Ibrahim Musa",
      specialty: "Dermatologist",
      rating: 4,
      review: "Good consultation for skin concerns. Dr. Musa provided effective treatment options and follow-up care instructions. The online platform worked perfectly for sharing images.",
      date: "2 weeks ago",
      helpful: 12,
      verified: true,
      consultation: "Skin Treatment",
      tags: ["Effective", "Tech-savvy", "Helpful"]
    }
  ];

  const stats = {
    totalReviews: 247,
    averageRating: 4.6,
    ratingDistribution: {
      5: 68,
      4: 22,
      3: 7,
      2: 2,
      1: 1
    }
  };

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
      title: "Review Submitted Successfully",
      description: "Thank you for your feedback! It helps others choose the right provider."
    });

    setRating(0);
    setReview("");
    setIsOpen(false);
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.review.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
    return matchesSearch && matchesRating;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">Reviews & Ratings</h1>
            <p className="text-white/90">Share your healthcare experiences</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
                <span className="text-2xl font-bold">{stats.averageRating}</span>
              </div>
              <p className="text-white/90 text-sm">Average Rating</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <MessageSquare className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold">{stats.totalReviews}</span>
              </div>
              <p className="text-white/90 text-sm">Total Reviews</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Award className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold">{Math.round((stats.ratingDistribution[5] / stats.totalReviews) * 100)}%</span>
              </div>
              <p className="text-white/90 text-sm">5-Star Reviews</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Action Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="lg" className="gradient-premium text-white">
                <Star className="w-5 h-5 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Rate Your Recent Consultation</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-3">Dr. Michael Okafor</h3>
                  <div className="flex justify-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-all duration-200 hover:scale-110"
                      >
                        <Star 
                          className={`w-10 h-10 ${
                            star <= rating 
                              ? "text-yellow-400 fill-current" 
                              : "text-muted-foreground hover:text-yellow-300"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Share your experience</label>
                  <Textarea 
                    placeholder="Tell others about your consultation experience..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button onClick={handleSubmitReview} className="w-full gradient-premium text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Submit Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search and Filter */}
          <div className="flex space-x-4 w-full md:w-auto">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-80"
            />
            <select 
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {/* Reviews List */}
            <div className="space-y-6">
              {filteredReviews.map((reviewItem) => (
                <Card key={reviewItem.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-lg font-bold">
                          {reviewItem.provider.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground">{reviewItem.provider}</h3>
                              {reviewItem.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Award className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{reviewItem.specialty}</span>
                              <span>•</span>
                              <span>{reviewItem.consultation}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
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
                            </div>
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {reviewItem.date}
                            </span>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3 leading-relaxed">{reviewItem.review}</p>

                        {/* Tags */}
                        <div className="flex items-center space-x-2 mb-3">
                          {reviewItem.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Helpful ({reviewItem.helpful})
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
                  <div key={rating} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={(count / stats.totalReviews) * 100} 
                        className="h-3"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {count} ({Math.round((count / stats.totalReviews) * 100)}%)
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Most Praised</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Professional communication</li>
                      <li>• Thorough examinations</li>
                      <li>• Clear explanations</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Top Specialties</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• General Practice (4.7★)</li>
                      <li>• Cardiology (4.6★)</li>
                      <li>• Endocrinology (4.5★)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RatingsReviewsPage;