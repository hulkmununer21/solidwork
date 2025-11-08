import { useState, useEffect } from "react";
import { Leaf, Search, BookOpen, AlertTriangle, Clock, Star, Heart, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient";

interface Remedy {
  id: string;
  title: string;
  condition: string;
  ingredients: string[];
  instructions: string[];
  duration: string;
  safety: 'safe' | 'caution' | 'consult-doctor';
  rating: number;
  category: string;
}

export const AIRemediesHub = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [aiRemedies, setAiRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Remedies' },
    { id: 'digestive', name: 'Digestive' },
    { id: 'respiratory', name: 'Respiratory' },
    { id: 'pain-relief', name: 'Pain Relief' },
    { id: 'skin-care', name: 'Skin Care' }
  ];

  // Fetch remedies from backend AI
  useEffect(() => {
    const fetchRemediesFromAI = async () => {
      setError(null);
      if (searchQuery.trim().length < 3 && selectedCategory === "all") {
        setAiRemedies([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch("/api/openai-remedies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery || selectedCategory
          })
        });
        if (!response.ok) {
          throw new Error("Failed to fetch remedies.");
        }
        const data = await response.json();
        // Assign unique IDs if missing
        const remedies = Array.isArray(data.remedies)
          ? data.remedies.map((r: any, idx: number) => ({
              ...r,
              id: r.id || String(idx + 1)
            }))
          : [];
        setAiRemedies(remedies);
      } catch (err: any) {
        setAiRemedies([]);
        setError(err.message || "Could not fetch remedies.");
      }
      setLoading(false);
    };

    // Only fetch if search or category is set
    if (searchQuery.trim().length > 2 || selectedCategory !== "all") {
      fetchRemediesFromAI();
    } else {
      setAiRemedies([]);
    }
  }, [searchQuery, selectedCategory]);

  // Get logged-in user id
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch favorites for user
  useEffect(() => {
    if (!userId) return;
    setFavLoading(true);
    setFavError(null);
    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("favorite_remedies")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        setFavError("Could not fetch favorites.");
        setFavorites([]);
      } else {
        setFavorites(data || []);
      }
      setFavLoading(false);
    };
    fetchFavorites();
  }, [userId]);

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'safe': return 'text-green-600';
      case 'caution': return 'text-yellow-600';
      case 'consult-doctor': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getSafetyText = (safety: string) => {
    switch (safety) {
      case 'safe': return 'Generally Safe';
      case 'caution': return 'Use with Caution';
      case 'consult-doctor': return 'Consult Doctor';
      default: return 'Unknown';
    }
  };

  // Save remedy as favorite
  const handleTryRemedy = async (remedy: Remedy) => {
    if (!userId) {
      toast({
        title: "Not logged in",
        description: "Please log in to save favorites."
      });
      return;
    }
    setFavLoading(true);
    const { error, data } = await supabase
      .from("favorite_remedies")
      .insert({
        user_id: userId,
        remedy_id: remedy.id,
        title: remedy.title,
        condition: remedy.condition,
        ingredients: remedy.ingredients,
        instructions: remedy.instructions,
        duration: remedy.duration,
        safety: remedy.safety,
        rating: remedy.rating,
        category: remedy.category
      })
      .select();
    if (!error && data && data.length > 0) {
      toast({
        title: "Remedy Added",
        description: `${remedy.title} has been added to your favorites.`
      });
      setFavorites(prev => [...prev, data[0]]);
    } else {
      toast({
        title: "Error",
        description: "Could not save remedy."
      });
    }
    setFavLoading(false);
  };

  // Remove favorite remedy
  const handleRemoveFavorite = async (favId: string) => {
    setFavLoading(true);
    const { error } = await supabase
      .from("favorite_remedies")
      .delete()
      .eq("id", favId);
    if (!error) {
      toast({
        title: "Removed",
        description: "Remedy removed from favorites."
      });
      setFavorites(prev => prev.filter(f => f.id !== favId));
    } else {
      toast({
        title: "Error",
        description: "Could not remove remedy."
      });
    }
    setFavLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">AI Remedies Hub</h2>
        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          Learn More
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These home remedies are for informational purposes only. Always consult with a healthcare provider before trying new treatments, especially if you have existing health conditions.
        </AlertDescription>
      </Alert>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search remedies by condition or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Remedies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Fetching AI remedies...</h3>
              <p className="text-muted-foreground">
                Please wait while we get remedies for you.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : aiRemedies.length > 0 ? (
          aiRemedies.map((remedy) => (
            <Card key={remedy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <Leaf className="w-5 h-5 mr-2 text-green-600" />
                      {remedy.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      For: {remedy.condition}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{remedy.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Safety Badge */}
                <Badge 
                  variant={remedy.safety === 'safe' ? 'secondary' : remedy.safety === 'caution' ? 'outline' : 'destructive'}
                  className={getSafetyColor(remedy.safety)}
                >
                  {getSafetyText(remedy.safety)}
                </Badge>

                {/* Ingredients */}
                <div>
                  <h4 className="font-medium mb-2">Ingredients:</h4>
                  <ul className="text-sm space-y-1">
                    {remedy.ingredients?.map((ingredient, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <ol className="text-sm space-y-1">
                    {remedy.instructions?.map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary font-medium mr-2 mt-0.5">{index + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Duration */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  Duration: {remedy.duration}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleTryRemedy(remedy)}
                  disabled={favLoading}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {favLoading ? "Adding..." : "Add to My Plan"}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No remedies found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse different categories.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Favorites Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">My Favorite Remedies</h3>
        {favLoading && (
          <div className="text-muted-foreground mb-2">Loading favorites...</div>
        )}
        {favError && (
          <div className="text-red-600 mb-2">{favError}</div>
        )}
        {favorites.length === 0 && !favLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No favorite remedies yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((remedy) => (
              <Card key={remedy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{remedy.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(remedy.id)}
                      disabled={favLoading}
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>For:</strong> {remedy.condition}
                  </p>
                  <Badge 
                    variant={remedy.safety === 'safe' ? 'secondary' : remedy.safety === 'caution' ? 'outline' : 'destructive'}
                    className={getSafetyColor(remedy.safety)}
                  >
                    {getSafetyText(remedy.safety)}
                  </Badge>
                  <div>
                    <strong>Ingredients:</strong>
                    <ul className="text-sm ml-2">
                      {Array.isArray(remedy.ingredients) && remedy.ingredients.map((ingredient: string, idx: number) => (
                        <li key={idx}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Instructions:</strong>
                    <ol className="text-sm ml-2">
                      {Array.isArray(remedy.instructions) && remedy.instructions.map((instruction: string, idx: number) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    Duration: {remedy.duration}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{remedy.rating}</span>
                  </div>
                  <div>
                    <strong>Category:</strong> {remedy.category}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};