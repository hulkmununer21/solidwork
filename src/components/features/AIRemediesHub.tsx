import { useState } from "react";
import { Leaf, Search, BookOpen, AlertTriangle, Clock, Star, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

  // Mock remedies data
  const remedies: Remedy[] = [
    {
      id: '1',
      title: 'Ginger Tea for Nausea',
      condition: 'Morning Sickness, Motion Sickness',
      ingredients: ['Fresh ginger root (1 inch)', 'Hot water (1 cup)', 'Honey (optional)'],
      instructions: [
        'Slice fresh ginger root thinly',
        'Steep in hot water for 10-15 minutes',
        'Add honey to taste',
        'Drink warm, 2-3 times daily'
      ],
      duration: '3-5 days',
      safety: 'safe',
      rating: 4.7,
      category: 'digestive'
    },
    {
      id: '2',
      title: 'Turmeric Milk for Inflammation',
      condition: 'Joint Pain, Inflammation',
      ingredients: ['Turmeric powder (1 tsp)', 'Warm milk (1 cup)', 'Black pepper (pinch)', 'Honey (1 tbsp)'],
      instructions: [
        'Mix turmeric powder with warm milk',
        'Add a pinch of black pepper',
        'Sweeten with honey',
        'Drink before bedtime'
      ],
      duration: '1-2 weeks',
      safety: 'safe',
      rating: 4.5,
      category: 'pain-relief'
    },
    {
      id: '3',
      title: 'Honey and Lemon for Cough',
      condition: 'Dry Cough, Throat Irritation',
      ingredients: ['Raw honey (2 tbsp)', 'Fresh lemon juice (1 tbsp)', 'Warm water (1 cup)'],
      instructions: [
        'Mix honey and lemon juice in warm water',
        'Stir well until dissolved',
        'Sip slowly',
        'Take 2-3 times daily'
      ],
      duration: '3-7 days',
      safety: 'safe',
      rating: 4.3,
      category: 'respiratory'
    },
    {
      id: '4',
      title: 'Aloe Vera for Skin Burns',
      condition: 'Minor Burns, Sunburn',
      ingredients: ['Fresh aloe vera gel', 'Cool water'],
      instructions: [
        'Clean the affected area with cool water',
        'Apply fresh aloe vera gel generously',
        'Leave on for 20-30 minutes',
        'Rinse with cool water if needed',
        'Apply 3-4 times daily'
      ],
      duration: '5-10 days',
      safety: 'caution',
      rating: 4.6,
      category: 'skin-care'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Remedies' },
    { id: 'digestive', name: 'Digestive' },
    { id: 'respiratory', name: 'Respiratory' },
    { id: 'pain-relief', name: 'Pain Relief' },
    { id: 'skin-care', name: 'Skin Care' }
  ];

  const filteredRemedies = remedies.filter(remedy => {
    const matchesSearch = remedy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         remedy.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || remedy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const handleTryRemedy = (remedy: Remedy) => {
    toast({
      title: "Remedy Added",
      description: `${remedy.title} has been added to your health plan.`
    });
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
        {filteredRemedies.map((remedy) => (
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
                  {remedy.ingredients.map((ingredient, index) => (
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
                  {remedy.instructions.map((instruction, index) => (
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
              >
                <Heart className="w-4 h-4 mr-2" />
                Add to My Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRemedies.length === 0 && (
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
  );
};